-- Multi-Tenant Organizations Schema Migration
-- ProcessAudit AI - Sprint 1 Multi-Tenant Foundation
-- Execute this in Supabase Dashboard > SQL Editor

-- Create organizations table for multi-tenant support
CREATE TABLE IF NOT EXISTS public.organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'enterprise')),
  industry_type TEXT DEFAULT 'general' CHECK (industry_type IN ('general', 'restaurant', 'hospitality', 'medical', 'manufacturing', 'retail', 'professional_services')),
  public_metadata JSONB DEFAULT '{}',
  private_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

-- Enable RLS for multi-tenant security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create organization_memberships table
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest')),
  permissions TEXT[] DEFAULT '{}',
  public_metadata JSONB DEFAULT '{}',
  private_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS for organization memberships
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- Add organization_id to existing tables for multi-tenant support
ALTER TABLE public.audit_reports ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES public.organizations(id);
ALTER TABLE public.automation_jobs ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES public.organizations(id);
ALTER TABLE public.generated_automations ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES public.organizations(id);

-- Create industry-specific SOP configuration table (for Sprint 2)
CREATE TABLE IF NOT EXISTS public.organization_industry_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  industry_type TEXT NOT NULL,
  industry_subtype TEXT,
  compliance_requirements TEXT[] DEFAULT '{}',
  custom_terminology JSONB DEFAULT '{}',
  prompt_customizations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  UNIQUE(organization_id)
);

-- Enable RLS for industry configuration
ALTER TABLE public.organization_industry_config ENABLE ROW LEVEL SECURITY;

-- Create SOP prompt templates table (for Sprint 2)
CREATE TABLE IF NOT EXISTS public.sop_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_type TEXT NOT NULL,
  template_name TEXT NOT NULL,
  prompt_content TEXT NOT NULL,
  template_version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(industry_type, template_name, template_version)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON public.organizations(industry_type);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_org_user ON public.organization_memberships(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_user ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_organization ON public.audit_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_organization ON public.automation_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_generated_automations_organization ON public.generated_automations(organization_id);
CREATE INDEX IF NOT EXISTS idx_industry_config_org ON public.organization_industry_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_sop_templates_industry ON public.sop_prompt_templates(industry_type, is_active);

-- Row Level Security Policies

-- Organizations: Users can only see organizations they're members of
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.organization_memberships
      WHERE organization_id = organizations.id
    )
  );

CREATE POLICY "Organization admins can update their organization" ON public.organizations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.organization_memberships
      WHERE organization_id = organizations.id AND role = 'admin'
    )
  );

-- Organization Memberships: Users can only see their own memberships
CREATE POLICY "Users can view their own memberships" ON public.organization_memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organization admins can manage memberships" ON public.organization_memberships
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
      AND om.role = 'admin'
    )
  );

-- Update existing table policies to include organization context
CREATE POLICY "Users can access audit reports from their organizations" ON public.audit_reports
  FOR ALL USING (
    organization_id IS NULL OR -- Backward compatibility
    auth.uid() IN (
      SELECT user_id FROM public.organization_memberships
      WHERE organization_id = audit_reports.organization_id
    )
  );

CREATE POLICY "Users can access automation jobs from their organizations" ON public.automation_jobs
  FOR ALL USING (
    organization_id IS NULL OR -- Backward compatibility
    auth.uid() IN (
      SELECT user_id FROM public.organization_memberships
      WHERE organization_id = automation_jobs.organization_id
    )
  );

CREATE POLICY "Users can access generated automations from their organizations" ON public.generated_automations
  FOR ALL USING (
    organization_id IS NULL OR -- Backward compatibility
    auth.uid() IN (
      SELECT user_id FROM public.organization_memberships
      WHERE organization_id = generated_automations.organization_id
    )
  );

-- Industry configuration: Only organization members can access
CREATE POLICY "Organization members can view industry config" ON public.organization_industry_config
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.organization_memberships
      WHERE organization_id = organization_industry_config.organization_id
    )
  );

CREATE POLICY "Organization admins can manage industry config" ON public.organization_industry_config
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.organization_memberships
      WHERE organization_id = organization_industry_config.organization_id
      AND role = 'admin'
    )
  );

-- SOP templates: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view SOP templates" ON public.sop_prompt_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert default SOP prompt templates for Sprint 2
INSERT INTO public.sop_prompt_templates (industry_type, template_name, prompt_content) VALUES
('general', 'standard_sop', 'Generate a comprehensive Standard Operating Procedure (SOP) for the following process. Include clear steps, responsibilities, quality checks, and safety considerations.'),
('restaurant', 'food_service_sop', 'Generate a food service Standard Operating Procedure (SOP) that includes food safety protocols, kitchen procedures, customer service standards, and health code compliance requirements.'),
('hospitality', 'hotel_service_sop', 'Generate a hospitality Standard Operating Procedure (SOP) that includes guest service protocols, housekeeping standards, front desk procedures, and safety/security measures.'),
('medical', 'clinical_sop', 'Generate a clinical Standard Operating Procedure (SOP) that includes patient safety protocols, clinical procedures, HIPAA compliance requirements, and quality assurance measures.'),
('manufacturing', 'production_sop', 'Generate a manufacturing Standard Operating Procedure (SOP) that includes quality control processes, safety protocols, equipment maintenance, and regulatory compliance.'),
('retail', 'customer_service_sop', 'Generate a retail Standard Operating Procedure (SOP) that includes customer service protocols, inventory management, point-of-sale procedures, and loss prevention measures.'),
('professional_services', 'client_service_sop', 'Generate a professional services Standard Operating Procedure (SOP) that includes client onboarding, project management, quality assurance, and service delivery standards.')
ON CONFLICT (industry_type, template_name, template_version) DO NOTHING;

-- Create a sample organization for testing (optional)
INSERT INTO public.organizations (id, name, slug, description, industry_type, created_by, updated_by, private_metadata) VALUES
('org_demo_hospitality', 'Demo Hospitality Corp', 'demo-hospitality', 'Demo organization for hospitality industry testing', 'hospitality', 'system', 'system', '{"plan": "premium", "features": {"enableAutomations": true, "enableReporting": true, "enableIntegrations": true}}')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.organizations IS 'Multi-tenant organizations for ProcessAudit AI';
COMMENT ON TABLE public.organization_memberships IS 'User memberships in organizations with roles and permissions';
COMMENT ON TABLE public.organization_industry_config IS 'Industry-specific configuration for SOP generation customization';
COMMENT ON TABLE public.sop_prompt_templates IS 'Industry-specific SOP prompt templates for customized generation';