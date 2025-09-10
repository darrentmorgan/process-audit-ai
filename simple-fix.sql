-- Simple fix: Modify existing user_id column to accept TEXT (Clerk user IDs)
-- This is the quickest fix for the immediate problem

-- Step 1: Make user_id column nullable temporarily for migration
ALTER TABLE public.audit_reports ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Change user_id column type from UUID to TEXT to accept Clerk user IDs
ALTER TABLE public.audit_reports ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Step 3: Update RLS policies to work with TEXT user IDs
DROP POLICY IF EXISTS "Users can view their own audit reports" ON public.audit_reports;
CREATE POLICY "Users can view their own audit reports"
  ON public.audit_reports FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub' OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own audit reports" ON public.audit_reports;
CREATE POLICY "Users can insert their own audit reports"
  ON public.audit_reports FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub' OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own audit reports" ON public.audit_reports;
CREATE POLICY "Users can update their own audit reports"
  ON public.audit_reports FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub' OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own audit reports" ON public.audit_reports;
CREATE POLICY "Users can delete their own audit reports"
  ON public.audit_reports FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub' OR user_id IS NULL);

-- Step 4: Add service role policy for full access
CREATE POLICY "Service role full access audit reports" ON public.audit_reports
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 5: Update the index
DROP INDEX IF EXISTS audit_reports_user_id_idx;
CREATE INDEX audit_reports_user_id_idx ON public.audit_reports(user_id);

COMMENT ON COLUMN public.audit_reports.user_id IS 'User ID - now supports both UUID (legacy) and Clerk user IDs (TEXT format)';