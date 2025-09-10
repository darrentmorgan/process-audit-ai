-- ProcessAudit AI - Clerk Authentication Migration
-- Fixes user ID handling for Clerk-only authentication system
-- Migration: clerk-auth-migration.sql

-- =============================================================================
-- PART 1: UPDATE EXISTING TABLES TO SUPPORT CLERK USER IDS
-- =============================================================================

-- Step 1: Update audit_reports table to use Clerk user IDs
-- Add clerk_user_id column and migrate existing data
ALTER TABLE public.audit_reports 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Update the user_id column to be nullable (for migration)
ALTER TABLE public.audit_reports 
ALTER COLUMN user_id DROP NOT NULL;

-- Add index for the new clerk_user_id column
CREATE INDEX IF NOT EXISTS audit_reports_clerk_user_id_idx ON public.audit_reports(clerk_user_id);

-- Step 2: Update profiles table for Clerk user IDs
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Update the profiles table primary key constraint
-- Note: This would require careful migration of existing data in production
-- For now, we'll just add the new column and index
CREATE INDEX IF NOT EXISTS profiles_clerk_user_id_idx ON public.profiles(clerk_user_id);

-- Step 3: Update organization_memberships table
ALTER TABLE public.organization_memberships 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Add index for clerk_user_id
CREATE INDEX IF NOT EXISTS org_memberships_clerk_user_id_idx ON public.organization_memberships(clerk_user_id);

-- Step 4: Update organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS created_by_clerk_id TEXT;

-- Step 5: Update automation_jobs and generated_automations tables
ALTER TABLE public.automation_jobs 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

ALTER TABLE public.generated_automations 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS automation_jobs_clerk_user_id_idx ON public.automation_jobs(clerk_user_id);
CREATE INDEX IF NOT EXISTS generated_automations_clerk_user_id_idx ON public.generated_automations(clerk_user_id);

-- =============================================================================
-- PART 2: CREATE HELPER FUNCTIONS FOR CLERK INTEGRATION
-- =============================================================================

-- Function to get user's organization context using Clerk user ID
CREATE OR REPLACE FUNCTION public.get_user_organization_context_clerk(clerk_user_id_param TEXT)
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
  WHERE om.clerk_user_id = clerk_user_id_param 
    AND om.status = 'active'
  ORDER BY om.created_at ASC
  LIMIT 1; -- Return first/primary organization
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check organization membership using Clerk user ID
CREATE OR REPLACE FUNCTION public.is_organization_member_clerk(clerk_user_id_param TEXT, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_memberships 
    WHERE clerk_user_id = clerk_user_id_param 
      AND organization_id = org_uuid 
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check organization admin using Clerk user ID
CREATE OR REPLACE FUNCTION public.is_organization_admin_clerk(clerk_user_id_param TEXT, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_memberships 
    WHERE clerk_user_id = clerk_user_id_param 
      AND organization_id = org_uuid 
      AND role = 'admin' 
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 3: UPDATE RLS POLICIES FOR CLERK AUTHENTICATION
-- =============================================================================

-- Update RLS policies to work with both auth.users and Clerk user IDs
-- This ensures backward compatibility during migration

-- Profiles policies (updated to support both auth systems)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile clerk"
  ON public.profiles FOR SELECT
  USING (
    -- Support both auth systems during transition
    (auth.uid() = id) OR 
    (clerk_user_id IS NOT NULL AND clerk_user_id = auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile clerk"
  ON public.profiles FOR UPDATE
  USING (
    (auth.uid() = id) OR 
    (clerk_user_id IS NOT NULL AND clerk_user_id = auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile clerk"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (auth.uid() = id) OR 
    (clerk_user_id IS NOT NULL AND clerk_user_id = auth.jwt() ->> 'sub')
  );

-- Audit reports policies (updated to support Clerk user IDs)
DROP POLICY IF EXISTS "Users can view their own audit reports" ON public.audit_reports;
CREATE POLICY "Users can view their own audit reports clerk"
  ON public.audit_reports FOR SELECT
  USING (
    -- Support both auth systems
    (auth.uid() = user_id) OR 
    (clerk_user_id IS NOT NULL AND clerk_user_id = auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "Users can insert their own audit reports" ON public.audit_reports;
CREATE POLICY "Users can insert their own audit reports clerk"
  ON public.audit_reports FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (clerk_user_id IS NOT NULL AND clerk_user_id = auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "Users can update their own audit reports" ON public.audit_reports;
CREATE POLICY "Users can update their own audit reports clerk"
  ON public.audit_reports FOR UPDATE
  USING (
    (auth.uid() = user_id) OR 
    (clerk_user_id IS NOT NULL AND clerk_user_id = auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "Users can delete their own audit reports" ON public.audit_reports;
CREATE POLICY "Users can delete their own audit reports clerk"
  ON public.audit_reports FOR DELETE
  USING (
    (auth.uid() = user_id) OR 
    (clerk_user_id IS NOT NULL AND clerk_user_id = auth.jwt() ->> 'sub')
  );

-- Service role policies (allow full access for backend operations)
CREATE POLICY "Service role full access audit reports" ON public.audit_reports
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access profiles" ON public.profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access automation jobs" ON public.automation_jobs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access generated automations" ON public.generated_automations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- PART 4: GRANT PERMISSIONS FOR NEW FUNCTIONS
-- =============================================================================

-- Grant permissions for Clerk helper functions
GRANT EXECUTE ON FUNCTION public.get_user_organization_context_clerk(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_organization_member_clerk(TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_organization_admin_clerk(TEXT, UUID) TO authenticated, anon;

-- =============================================================================
-- PART 5: CREATE MIGRATION NOTES AND COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.audit_reports.clerk_user_id IS 'Clerk user ID for reports created with Clerk authentication';
COMMENT ON COLUMN public.profiles.clerk_user_id IS 'Clerk user ID for user profiles';
COMMENT ON COLUMN public.organization_memberships.clerk_user_id IS 'Clerk user ID for organization memberships';

-- Note: This migration adds support for Clerk user IDs alongside existing UUID-based user_id columns
-- This allows for a gradual migration and backward compatibility
-- In a production system, you would want to:
-- 1. Run this migration
-- 2. Update application code to use clerk_user_id columns
-- 3. Migrate existing data from user_id to clerk_user_id columns
-- 4. Eventually drop the old user_id columns and auth.users references
