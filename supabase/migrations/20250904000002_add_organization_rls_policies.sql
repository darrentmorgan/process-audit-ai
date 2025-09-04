-- ProcessAudit AI - Multi-Tenant Organizations RLS Policies
-- Phase 2: Row Level Security Implementation
-- Migration: 20250904000002_add_organization_rls_policies

-- =============================================================================
-- PART 1: ENABLE RLS ON NEW TABLES
-- =============================================================================

-- Enable RLS on organizations and organization_memberships tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 2: DROP EXISTING NON-ORGANIZATION RLS POLICIES
-- =============================================================================

-- We need to drop existing policies and recreate them with organization context
-- This ensures complete data isolation between organizations

-- Drop existing audit_reports policies
DROP POLICY IF EXISTS "Users can view their own audit reports" ON public.audit_reports;
DROP POLICY IF EXISTS "Users can insert their own audit reports" ON public.audit_reports;
DROP POLICY IF EXISTS "Users can update their own audit reports" ON public.audit_reports;
DROP POLICY IF EXISTS "Users can delete their own audit reports" ON public.audit_reports;

-- Drop existing automation_jobs policies (if they exist)
DROP POLICY IF EXISTS "Users can view own automation jobs" ON public.automation_jobs;
DROP POLICY IF EXISTS "Users can create own automation jobs" ON public.automation_jobs;
DROP POLICY IF EXISTS "Users can update own automation jobs" ON public.automation_jobs;

-- Drop existing generated_automations policies (if they exist)  
DROP POLICY IF EXISTS "Users can view own generated automations" ON public.generated_automations;

-- =============================================================================
-- PART 3: ORGANIZATIONS TABLE RLS POLICIES
-- =============================================================================

-- Policy: Public can discover organizations (for routing and signup)
CREATE POLICY "Public can discover organizations"
  ON public.organizations FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Organization members can view their organization details
CREATE POLICY "Members can view organization details"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- Policy: Organization admins can update their organization
CREATE POLICY "Admins can update organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
        AND om.status = 'active'
    )
  );

-- Policy: Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy: Service role has full access (for Clerk sync and Workers)
CREATE POLICY "Service role full access to organizations"
  ON public.organizations FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- PART 4: ORGANIZATION MEMBERSHIPS TABLE RLS POLICIES  
-- =============================================================================

-- Policy: Users can view memberships they are part of
CREATE POLICY "Users can view their memberships"
  ON public.organization_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin')
        AND om.status = 'active'
    )
  );

-- Policy: Organization admins can manage memberships
CREATE POLICY "Organization admins can manage memberships"
  ON public.organization_memberships FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
        AND om.status = 'active'
    )
  );

-- Policy: Users can accept their own invitations (insert/update their own membership)
CREATE POLICY "Users can accept invitations"
  ON public.organization_memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own membership"
  ON public.organization_memberships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Service role has full access
CREATE POLICY "Service role full access to memberships"
  ON public.organization_memberships FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- PART 5: PROFILES TABLE ORGANIZATION-AWARE RLS POLICIES
-- =============================================================================

-- Keep existing profile policies but make them organization-aware

-- Policy: Users can view profiles in their organizations
CREATE POLICY "Users can view profiles in their organizations"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can always view their own profile
    id = auth.uid() OR
    -- Users can view profiles of members in their organizations
    EXISTS (
      SELECT 1 FROM public.organization_memberships om1
      JOIN public.organization_memberships om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = profiles.id
        AND om1.status = 'active'
        AND om2.status = 'active'
    )
  );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Keep the existing insert policy
-- (handled by existing "Users can insert their own profile" policy)

-- =============================================================================
-- PART 6: AUDIT REPORTS TABLE ORGANIZATION-AWARE RLS POLICIES
-- =============================================================================

-- Policy: Users can view audit reports in their organizations
CREATE POLICY "Organization members can view audit reports"
  ON public.audit_reports FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own reports
    user_id = auth.uid() OR
    -- Users can view reports in their organizations
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = audit_reports.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    ))
  );

-- Policy: Users can insert audit reports in their organizations
CREATE POLICY "Users can create audit reports in their organizations"
  ON public.audit_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      -- Personal reports (no organization)
      organization_id IS NULL OR
      -- Organization reports (user must be member)
      EXISTS (
        SELECT 1 FROM public.organization_memberships om
        WHERE om.organization_id = audit_reports.organization_id
          AND om.user_id = auth.uid()
          AND om.status = 'active'
      )
    )
  );

-- Policy: Users can update their own reports or org reports they have access to
CREATE POLICY "Users can update accessible audit reports"
  ON public.audit_reports FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = audit_reports.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('admin', 'member') -- Members can edit org reports
    ))
  );

-- Policy: Users can delete their own reports or admins can delete org reports
CREATE POLICY "Users can delete accessible audit reports"
  ON public.audit_reports FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = audit_reports.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role = 'admin' -- Only admins can delete org reports
    ))
  );

-- =============================================================================
-- PART 7: AUTOMATION JOBS TABLE ORGANIZATION-AWARE RLS POLICIES
-- =============================================================================

-- Policy: Users can view automation jobs in their organizations
CREATE POLICY "Organization members can view automation jobs"
  ON public.automation_jobs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = automation_jobs.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    ))
  );

-- Policy: Users can create automation jobs in their organizations
CREATE POLICY "Users can create automation jobs in their organizations"
  ON public.automation_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      organization_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.organization_memberships om
        WHERE om.organization_id = automation_jobs.organization_id
          AND om.user_id = auth.uid()
          AND om.status = 'active'
      )
    )
  );

-- Policy: Users can update their accessible automation jobs
CREATE POLICY "Users can update accessible automation jobs"
  ON public.automation_jobs FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = automation_jobs.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('admin', 'member')
    ))
  );

-- =============================================================================
-- PART 8: GENERATED AUTOMATIONS TABLE ORGANIZATION-AWARE RLS POLICIES
-- =============================================================================

-- Policy: Users can view generated automations in their organizations
CREATE POLICY "Organization members can view generated automations"
  ON public.generated_automations FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = generated_automations.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    ) OR
    -- Can also access via job ownership
    EXISTS (
      SELECT 1 FROM public.automation_jobs aj
      WHERE aj.id = generated_automations.job_id
        AND aj.user_id = auth.uid()
    )
  );

-- Policy: Generated automations are created via service role (Workers)
CREATE POLICY "Service role can manage generated automations"
  ON public.generated_automations FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- PART 9: SERVICE ROLE POLICIES FOR WORKERS INTEGRATION
-- =============================================================================

-- Ensure service role can access all tables for Workers integration
CREATE POLICY "Service role full access to audit reports"
  ON public.audit_reports FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access to automation jobs"
  ON public.automation_jobs FOR ALL
  TO service_role
  USING (true);

-- Service role can access profiles for user context
CREATE POLICY "Service role can access profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- PART 10: WAITLIST TABLE ORGANIZATION CONTEXT (Optional)
-- =============================================================================

-- Waitlist remains mostly public but can track organization context
-- Keep existing policies, no changes needed for waitlist

-- =============================================================================
-- PART 11: ANALYTICS AND MONITORING VIEWS
-- =============================================================================

-- Update audit stats view to be organization-aware
DROP VIEW IF EXISTS public.audit_stats;
CREATE OR REPLACE VIEW public.audit_stats AS
SELECT
  COALESCE(o.name, 'Personal') as organization_name,
  COALESCE(ar.organization_id::text, 'personal') as organization_context,
  COUNT(*) as total_reports,
  COUNT(DISTINCT ar.user_id) as unique_users,
  AVG(EXTRACT(EPOCH FROM (ar.updated_at - ar.created_at))/60) as avg_completion_time_minutes,
  DATE_TRUNC('day', ar.created_at) as date
FROM public.audit_reports ar
LEFT JOIN public.organizations o ON ar.organization_id = o.id
GROUP BY o.name, ar.organization_id, DATE_TRUNC('day', ar.created_at)
ORDER BY date DESC;

-- Organization membership stats view
CREATE OR REPLACE VIEW public.organization_stats AS
SELECT
  o.id as organization_id,
  o.name as organization_name,
  o.plan,
  COUNT(om.id) as total_members,
  COUNT(CASE WHEN om.role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN om.role = 'member' THEN 1 END) as member_count,
  COUNT(CASE WHEN om.role = 'guest' THEN 1 END) as guest_count,
  COUNT(CASE WHEN om.status = 'active' THEN 1 END) as active_members,
  COUNT(CASE WHEN om.status = 'invited' THEN 1 END) as pending_invitations,
  o.created_at as org_created_at
FROM public.organizations o
LEFT JOIN public.organization_memberships om ON o.id = om.organization_id
GROUP BY o.id, o.name, o.plan, o.created_at
ORDER BY o.created_at DESC;

COMMENT ON VIEW public.audit_stats IS 'Organization-aware audit report statistics';
COMMENT ON VIEW public.organization_stats IS 'Organization membership and activity statistics';