-- ProcessAudit AI - Multi-Tenant Organizations Implementation
-- Phase 2: Database Schema Migration
-- Migration: 20250904000001_add_multi_tenant_organizations

-- =============================================================================
-- PART 1: CREATE CORE ORGANIZATION TABLES
-- =============================================================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE NOT NULL, -- Clerk organization ID for sync
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  website TEXT,
  industry TEXT,
  
  -- Plan and billing
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'professional', 'enterprise')),
  max_members INTEGER DEFAULT 5,
  max_projects INTEGER DEFAULT 10,
  
  -- Metadata
  public_metadata JSONB DEFAULT '{}',
  private_metadata JSONB DEFAULT '{}',
  
  -- Settings
  settings JSONB DEFAULT '{
    "features": {
      "enableAutomations": true,
      "enableReporting": true,
      "enableIntegrations": true,
      "enableAnalytics": false
    },
    "security": {
      "requireTwoFactor": false,
      "allowGuestAccess": false,
      "sessionTimeout": null,
      "ipWhitelist": []
    },
    "notifications": {
      "emailNotifications": true,
      "slackWebhook": null,
      "webhookUrl": null
    }
  }',
  
  -- Branding
  branding JSONB DEFAULT '{
    "primaryColor": null,
    "secondaryColor": null,
    "logoUrl": null,
    "faviconUrl": null,
    "customDomain": null
  }',
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Constraints
  CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  CONSTRAINT organizations_slug_length CHECK (LENGTH(slug) >= 3 AND LENGTH(slug) <= 63)
);

-- Create organization_memberships table for user-org relationships
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clerk_membership_id TEXT UNIQUE, -- Clerk membership ID for sync
  
  -- Role and permissions
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest')),
  permissions TEXT[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Constraints
  UNIQUE(organization_id, user_id)
);

-- =============================================================================
-- PART 2: ADD ORG_ID COLUMNS TO EXISTING TABLES
-- =============================================================================

-- Add org_id to profiles table (optional - users can exist without org)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add org_id to audit_reports table
ALTER TABLE public.audit_reports 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add org_id to automation_jobs table
ALTER TABLE public.automation_jobs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add org_id to generated_automations table (via job relationship, but explicit for performance)
ALTER TABLE public.generated_automations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add org_id to waitlist table (optional - for tracking which org context they signed up from)
ALTER TABLE public.waitlist 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- =============================================================================
-- PART 3: CREATE PERFORMANCE INDEXES
-- =============================================================================

-- Organizations indexes
CREATE INDEX IF NOT EXISTS organizations_clerk_org_id_idx ON public.organizations(clerk_org_id);
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_created_by_idx ON public.organizations(created_by);
CREATE INDEX IF NOT EXISTS organizations_plan_idx ON public.organizations(plan);
CREATE INDEX IF NOT EXISTS organizations_created_at_idx ON public.organizations(created_at DESC);

-- Organization memberships indexes  
CREATE INDEX IF NOT EXISTS org_memberships_org_id_idx ON public.organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS org_memberships_user_id_idx ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS org_memberships_clerk_id_idx ON public.organization_memberships(clerk_membership_id);
CREATE INDEX IF NOT EXISTS org_memberships_role_idx ON public.organization_memberships(role);
CREATE INDEX IF NOT EXISTS org_memberships_status_idx ON public.organization_memberships(status);
CREATE INDEX IF NOT EXISTS org_memberships_user_org_role_idx ON public.organization_memberships(user_id, organization_id, role);

-- Multi-tenant indexes for existing tables
CREATE INDEX IF NOT EXISTS profiles_organization_id_idx ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS audit_reports_organization_id_idx ON public.audit_reports(organization_id);
CREATE INDEX IF NOT EXISTS audit_reports_org_user_idx ON public.audit_reports(organization_id, user_id);
CREATE INDEX IF NOT EXISTS automation_jobs_organization_id_idx ON public.automation_jobs(organization_id);
CREATE INDEX IF NOT EXISTS automation_jobs_org_user_idx ON public.automation_jobs(organization_id, user_id);
CREATE INDEX IF NOT EXISTS generated_automations_organization_id_idx ON public.generated_automations(organization_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS audit_reports_org_created_at_idx ON public.audit_reports(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_jobs_org_status_idx ON public.automation_jobs(organization_id, status);

-- =============================================================================
-- PART 4: CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to get user's organization context
CREATE OR REPLACE FUNCTION public.get_user_organization_context(user_uuid UUID)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  membership_role TEXT,
  membership_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    om.role,
    om.status
  FROM public.organizations o
  JOIN public.organization_memberships om ON o.id = om.organization_id
  WHERE om.user_id = user_uuid 
    AND om.status = 'active'
  ORDER BY om.created_at ASC
  LIMIT 1; -- Return first/primary organization
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check organization membership
CREATE OR REPLACE FUNCTION public.is_organization_member(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_memberships 
    WHERE user_id = user_uuid 
      AND organization_id = org_uuid 
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check organization admin
CREATE OR REPLACE FUNCTION public.is_organization_admin(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_memberships 
    WHERE user_id = user_uuid 
      AND organization_id = org_uuid 
      AND role = 'admin' 
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization by slug
CREATE OR REPLACE FUNCTION public.get_organization_by_slug(org_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  image_url TEXT,
  plan TEXT,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.description,
    o.image_url,
    o.plan,
    o.settings,
    o.created_at
  FROM public.organizations o
  WHERE o.slug = org_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 5: CREATE UPDATED_AT TRIGGERS
-- =============================================================================

-- Add updated_at trigger for organizations
CREATE TRIGGER handle_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at trigger for organization_memberships
CREATE TRIGGER handle_org_memberships_updated_at
  BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- PART 6: GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions for organizations table
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon; -- For public organization discovery

-- Grant permissions for organization_memberships table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations_memberships TO authenticated;

-- Grant permissions for helper functions
GRANT EXECUTE ON FUNCTION public.get_user_organization_context(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_organization_member(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_organization_admin(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_by_slug(TEXT) TO authenticated, anon;

-- =============================================================================
-- PART 7: CREATE DEFAULT ORGANIZATION AND MIGRATION DATA
-- =============================================================================

-- Create a default organization for existing data migration
INSERT INTO public.organizations (
  id,
  clerk_org_id,
  slug,
  name,
  description,
  plan,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000'::UUID,
  'default-org',
  'default',
  'Default Organization',
  'Default organization for existing users and data migration',
  'free',
  NOW(),
  NOW()
) ON CONFLICT (clerk_org_id) DO NOTHING;

-- Note: The actual data migration will be handled by separate migration scripts
-- This ensures we have a default organization for backward compatibility

COMMENT ON TABLE public.organizations IS 'Multi-tenant organizations for ProcessAudit AI';
COMMENT ON TABLE public.organization_memberships IS 'User membership relationships with organizations';
COMMENT ON COLUMN public.organizations.clerk_org_id IS 'Synchronization ID with Clerk organization system';
COMMENT ON COLUMN public.organization_memberships.clerk_membership_id IS 'Synchronization ID with Clerk membership system';