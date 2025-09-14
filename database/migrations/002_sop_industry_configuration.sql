-- Sprint 2 Story 1: SOP Industry Configuration Schema
-- Execute this in Supabase Dashboard > SQL Editor

-- Create organization_industry_config table for detailed industry customization
CREATE TABLE IF NOT EXISTS public.organization_industry_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  industry_type TEXT NOT NULL,
  industry_subtype TEXT,
  compliance_requirements TEXT[] DEFAULT '{}',
  custom_terminology JSONB DEFAULT '{}',
  prompt_customizations JSONB DEFAULT '{}',
  sop_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  UNIQUE(organization_id)
);

-- Create SOP prompt templates table
CREATE TABLE IF NOT EXISTS public.sop_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_type TEXT NOT NULL,
  template_name TEXT NOT NULL,
  prompt_content TEXT NOT NULL,
  template_description TEXT,
  template_version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(industry_type, template_name, template_version)
);

-- Enable RLS for multi-tenant security
ALTER TABLE public.organization_industry_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_industry_config_org ON public.organization_industry_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_industry_config_type ON public.organization_industry_config(industry_type);
CREATE INDEX IF NOT EXISTS idx_sop_templates_industry_active ON public.sop_prompt_templates(industry_type, is_active);
CREATE INDEX IF NOT EXISTS idx_sop_templates_name ON public.sop_prompt_templates(template_name);

-- Insert industry-specific SOP prompt templates
INSERT INTO public.sop_prompt_templates (industry_type, template_name, prompt_content, template_description) VALUES

-- General business template
('general', 'standard_sop',
'Generate a comprehensive Standard Operating Procedure (SOP) for the following process. Include clear step-by-step instructions, responsibilities, quality checks, safety considerations, and compliance requirements. Structure the SOP with: 1) Purpose and Scope, 2) Responsibilities, 3) Procedure Steps, 4) Quality Control, 5) Safety Requirements, 6) Documentation and Records.',
'Standard SOP template for general business processes'),

-- Restaurant industry templates
('restaurant', 'food_service_sop',
'Generate a food service Standard Operating Procedure (SOP) that includes food safety protocols, kitchen procedures, customer service standards, and health code compliance requirements. Ensure the SOP addresses: 1) Food Safety and HACCP principles, 2) Kitchen hygiene and sanitation, 3) Customer service excellence, 4) Health department compliance, 5) Staff training requirements, 6) Emergency procedures. Include specific temperature controls, cleaning schedules, and food handling best practices.',
'Food service SOP template with safety and compliance focus'),

-- Hospitality industry templates
('hospitality', 'hotel_service_sop',
'Generate a hospitality Standard Operating Procedure (SOP) that includes guest service protocols, housekeeping standards, front desk procedures, and safety/security measures. Structure the SOP to cover: 1) Guest Experience Excellence, 2) Housekeeping quality standards, 3) Front desk operations, 4) Safety and security protocols, 5) Staff communication procedures, 6) Problem resolution processes. Include brand standards, service recovery, and guest satisfaction metrics.',
'Hospitality SOP template for guest service excellence'),

-- Medical industry templates
('medical', 'clinical_sop',
'Generate a clinical Standard Operating Procedure (SOP) that includes patient safety protocols, clinical procedures, HIPAA compliance requirements, and quality assurance measures. Ensure the SOP addresses: 1) Patient Safety and Quality, 2) Clinical procedure standards, 3) HIPAA privacy and security, 4) Documentation requirements, 5) Regulatory compliance, 6) Staff competency and training. Include infection control, medical device protocols, and patient communication standards.',
'Medical SOP template with clinical safety and compliance focus'),

-- Manufacturing industry templates
('manufacturing', 'production_sop',
'Generate a manufacturing Standard Operating Procedure (SOP) that includes quality control processes, safety protocols, equipment maintenance, and regulatory compliance. Structure to include: 1) Production Quality Standards, 2) Equipment operation and maintenance, 3) Safety procedures and PPE requirements, 4) Quality control and testing, 5) Regulatory compliance (OSHA, FDA, etc.), 6) Continuous improvement processes. Include lean manufacturing principles and efficiency metrics.',
'Manufacturing SOP template for production quality and safety'),

-- Retail industry templates
('retail', 'customer_service_sop',
'Generate a retail Standard Operating Procedure (SOP) that includes customer service protocols, inventory management, point-of-sale procedures, and loss prevention measures. Cover: 1) Customer Service Excellence, 2) Sales and transaction procedures, 3) Inventory management and control, 4) Loss prevention and security, 5) Store operations and maintenance, 6) Staff scheduling and training. Include customer satisfaction metrics and sales performance standards.',
'Retail SOP template for customer service and operations'),

-- Professional services templates
('professional_services', 'client_service_sop',
'Generate a professional services Standard Operating Procedure (SOP) that includes client onboarding, project management, quality assurance, and service delivery standards. Structure to include: 1) Client Relationship Management, 2) Project planning and execution, 3) Quality assurance and deliverables, 4) Communication protocols, 5) Professional standards and ethics, 6) Continuous improvement and feedback. Include client satisfaction metrics and service level agreements.',
'Professional services SOP template for client service excellence')

ON CONFLICT (industry_type, template_name, template_version) DO NOTHING;

-- Create RLS policies for industry configuration
CREATE POLICY "Organization members can view their industry config" ON public.organization_industry_config
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage industry config" ON public.organization_industry_config
  FOR ALL USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- SOP templates are readable by all authenticated users
CREATE POLICY "Authenticated users can view SOP templates" ON public.sop_prompt_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only system can modify SOP templates (for now)
CREATE POLICY "System can manage SOP templates" ON public.sop_prompt_templates
  FOR ALL USING (auth.uid() IS NOT NULL AND current_user = 'supabase_admin');

COMMENT ON TABLE public.organization_industry_config IS 'Industry-specific configuration for organization SOP generation customization';
COMMENT ON TABLE public.sop_prompt_templates IS 'Industry-specific SOP prompt templates for customized generation';