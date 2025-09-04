-- ProcessAudit AI - Multi-Tenant Organizations Rollback Script
-- Phase 2: Complete Rollback of Multi-Tenancy Implementation
-- Rollback Script: rollback-multi-tenant-organizations.sql

-- ⚠️  WARNING: THIS SCRIPT WILL REMOVE ALL MULTI-TENANT FUNCTIONALITY
-- ⚠️  ALL ORGANIZATION DATA WILL BE LOST
-- ⚠️  ONLY RUN THIS IF YOU NEED TO COMPLETELY ROLLBACK THE MIGRATION

-- =============================================================================
-- PART 1: ROLLBACK CONFIRMATION AND SAFETY CHECKS
-- =============================================================================

DO $$
DECLARE
  org_count INTEGER;
  membership_count INTEGER;
  proceed BOOLEAN := FALSE;
BEGIN
  -- Check how much data will be lost
  SELECT COUNT(*) INTO org_count FROM public.organizations WHERE clerk_org_id != 'default-org';
  SELECT COUNT(*) INTO membership_count FROM public.organization_memberships;
  
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'MULTI-TENANT ROLLBACK SAFETY CHECK';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'This rollback will DELETE:';
  RAISE NOTICE '- % organizations (excluding default)', org_count;
  RAISE NOTICE '- % organization memberships', membership_count;
  RAISE NOTICE '- All organization-related RLS policies';
  RAISE NOTICE '- All organization helper functions';
  RAISE NOTICE '- All organization indexes';
  RAISE NOTICE '=====================================';
  
  -- Uncomment the next line to enable rollback (safety measure)
  -- proceed := TRUE;
  
  IF NOT proceed THEN
    RAISE EXCEPTION 'Rollback safety check failed. Uncomment the proceed := TRUE line to enable rollback.';
  END IF;
  
  RAISE NOTICE 'Proceeding with rollback...';
END;
$$;

-- =============================================================================
-- PART 2: DROP VIEWS AND ANALYTICS
-- =============================================================================

-- Drop analytics views
DROP VIEW IF EXISTS public.organization_stats CASCADE;

-- Recreate original audit_stats view without organization context
DROP VIEW IF EXISTS public.audit_stats CASCADE;
CREATE OR REPLACE VIEW public.audit_stats AS
SELECT
  COUNT(*) as total_reports,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_completion_time_minutes,
  DATE_TRUNC('day', created_at) as date
FROM public.audit_reports
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- =============================================================================
-- PART 3: DROP RLS POLICIES (ORGANIZATION-AWARE POLICIES)
-- =============================================================================

-- Drop organization table policies
DROP POLICY IF EXISTS "Public can discover organizations" ON public.organizations;
DROP POLICY IF EXISTS "Members can view organization details" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update organization" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Service role full access to organizations" ON public.organizations;

-- Drop organization_memberships policies
DROP POLICY IF EXISTS "Users can view their memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Organization admins can manage memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Users can accept invitations" ON public.organization_memberships;
DROP POLICY IF EXISTS "Users can update own membership" ON public.organization_memberships;
DROP POLICY IF EXISTS "Service role full access to memberships" ON public.organization_memberships;

-- Drop updated profile policies
DROP POLICY IF EXISTS "Users can view profiles in their organizations" ON public.profiles;

-- Drop organization-aware audit report policies
DROP POLICY IF EXISTS "Organization members can view audit reports" ON public.audit_reports;
DROP POLICY IF EXISTS "Users can create audit reports in their organizations" ON public.audit_reports;
DROP POLICY IF EXISTS "Users can update accessible audit reports" ON public.audit_reports;
DROP POLICY IF EXISTS "Users can delete accessible audit reports" ON public.audit_reports;

-- Drop organization-aware automation job policies
DROP POLICY IF EXISTS "Organization members can view automation jobs" ON public.automation_jobs;
DROP POLICY IF EXISTS "Users can create automation jobs in their organizations" ON public.automation_jobs;
DROP POLICY IF EXISTS "Users can update accessible automation jobs" ON public.automation_jobs;

-- Drop organization-aware generated automation policies
DROP POLICY IF EXISTS "Organization members can view generated automations" ON public.generated_automations;
DROP POLICY IF EXISTS "Service role can manage generated automations" ON public.generated_automations;

-- Drop service role policies
DROP POLICY IF EXISTS "Service role full access to audit reports" ON public.audit_reports;
DROP POLICY IF EXISTS "Service role full access to automation jobs" ON public.automation_jobs;
DROP POLICY IF EXISTS "Service role can access profiles" ON public.profiles;

-- =============================================================================
-- PART 4: RESTORE ORIGINAL RLS POLICIES
-- =============================================================================

-- Restore original audit_reports policies
CREATE POLICY "Users can view their own audit reports"
  ON public.audit_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit reports"
  ON public.audit_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audit reports"
  ON public.audit_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audit reports"
  ON public.audit_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Restore original automation job policies (if they existed)
CREATE POLICY "Users can view own automation jobs"
  ON public.automation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own automation jobs"
  ON public.automation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automation jobs"
  ON public.automation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Restore original generated automations policy
CREATE POLICY "Users can view own generated automations"
  ON public.generated_automations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_jobs
      WHERE automation_jobs.id = generated_automations.job_id
      AND automation_jobs.user_id = auth.uid()
    )
  );

-- Restore service role policies for Workers
CREATE POLICY "Service role full access to automation_jobs"
  ON public.automation_jobs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to generated_automations"
  ON public.generated_automations FOR ALL
  USING (auth.role() = 'service_role');

-- Restore original profile policy
CREATE POLICY "Users can view profiles in their organizations"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- =============================================================================
-- PART 5: DROP HELPER FUNCTIONS
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_user_organization_context(UUID);
DROP FUNCTION IF EXISTS public.is_organization_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_organization_admin(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_organization_by_slug(TEXT);

-- =============================================================================
-- PART 6: REMOVE ORGANIZATION_ID COLUMNS
-- =============================================================================

-- Remove organization_id columns from existing tables
-- Note: This will cause data loss if there are organization-scoped records

-- Backup organization-scoped data before dropping columns (optional)
-- CREATE TEMP TABLE backup_org_audit_reports AS 
-- SELECT * FROM public.audit_reports WHERE organization_id IS NOT NULL;

-- CREATE TEMP TABLE backup_org_automation_jobs AS 
-- SELECT * FROM public.automation_jobs WHERE organization_id IS NOT NULL;

-- Drop foreign key constraints first, then columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organization_id;
ALTER TABLE public.audit_reports DROP COLUMN IF EXISTS organization_id;
ALTER TABLE public.automation_jobs DROP COLUMN IF EXISTS organization_id;
ALTER TABLE public.generated_automations DROP COLUMN IF EXISTS organization_id;
ALTER TABLE public.waitlist DROP COLUMN IF EXISTS organization_id;

-- =============================================================================
-- PART 7: DROP INDEXES
-- =============================================================================

-- Drop organization-specific indexes
DROP INDEX IF EXISTS public.organizations_clerk_org_id_idx;
DROP INDEX IF EXISTS public.organizations_slug_idx;
DROP INDEX IF EXISTS public.organizations_created_by_idx;
DROP INDEX IF EXISTS public.organizations_plan_idx;
DROP INDEX IF EXISTS public.organizations_created_at_idx;

-- Drop organization membership indexes
DROP INDEX IF EXISTS public.org_memberships_org_id_idx;
DROP INDEX IF EXISTS public.org_memberships_user_id_idx;
DROP INDEX IF EXISTS public.org_memberships_clerk_id_idx;
DROP INDEX IF EXISTS public.org_memberships_role_idx;
DROP INDEX IF EXISTS public.org_memberships_status_idx;
DROP INDEX IF EXISTS public.org_memberships_user_org_role_idx;

-- Drop multi-tenant indexes from existing tables
DROP INDEX IF EXISTS public.profiles_organization_id_idx;
DROP INDEX IF EXISTS public.audit_reports_organization_id_idx;
DROP INDEX IF EXISTS public.audit_reports_org_user_idx;
DROP INDEX IF EXISTS public.automation_jobs_organization_id_idx;
DROP INDEX IF EXISTS public.automation_jobs_org_user_idx;
DROP INDEX IF EXISTS public.generated_automations_organization_id_idx;
DROP INDEX IF EXISTS public.audit_reports_org_created_at_idx;
DROP INDEX IF EXISTS public.automation_jobs_org_status_idx;

-- =============================================================================
-- PART 8: DROP TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS handle_organizations_updated_at ON public.organizations;
DROP TRIGGER IF EXISTS handle_org_memberships_updated_at ON public.organization_memberships;

-- =============================================================================
-- PART 9: DROP TABLES
-- =============================================================================

-- Disable RLS before dropping tables
ALTER TABLE public.organization_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Drop tables in correct order (memberships first due to foreign key)
DROP TABLE IF EXISTS public.organization_memberships CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- =============================================================================
-- PART 10: REVOKE PERMISSIONS
-- =============================================================================

-- Revoke any remaining permissions (functions already dropped)
-- No specific revocations needed as tables are dropped

-- =============================================================================
-- PART 11: VERIFICATION AND CLEANUP
-- =============================================================================

DO $$
DECLARE
  remaining_policies INTEGER;
  remaining_functions INTEGER;
  remaining_indexes INTEGER;
BEGIN
  -- Check for any remaining organization-related policies
  SELECT COUNT(*) INTO remaining_policies
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND policyname ILIKE '%organization%';
    
  -- Check for any remaining organization functions
  SELECT COUNT(*) INTO remaining_functions
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name ILIKE '%organization%';
    
  -- Check for any remaining organization indexes
  SELECT COUNT(*) INTO remaining_indexes
  FROM pg_indexes 
  WHERE schemaname = 'public' 
    AND indexname ILIKE '%org%';
  
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'ROLLBACK VERIFICATION';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Remaining organization policies: %', remaining_policies;
  RAISE NOTICE 'Remaining organization functions: %', remaining_functions;
  RAISE NOTICE 'Remaining organization indexes: %', remaining_indexes;
  
  IF remaining_policies = 0 AND remaining_functions = 0 THEN
    RAISE NOTICE '✅ Rollback completed successfully';
  ELSE
    RAISE WARNING '⚠️  Rollback may be incomplete - manual cleanup required';
  END IF;
  
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'POST-ROLLBACK TASKS:';
  RAISE NOTICE '1. Update application code to remove organization features';
  RAISE NOTICE '2. Update Workers to use non-organization database functions';
  RAISE NOTICE '3. Update API routes to remove organization context';
  RAISE NOTICE '4. Test application functionality without organizations';
  RAISE NOTICE '5. Deploy updated application code';
  RAISE NOTICE '=====================================';
END;
$$;

-- Final cleanup
RESET search_path;