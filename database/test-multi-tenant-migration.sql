-- ProcessAudit AI - Multi-Tenant Migration Testing and Validation
-- Phase 2: Comprehensive Database Testing Suite
-- Test Script: test-multi-tenant-migration.sql

-- =============================================================================
-- PART 1: TEST SETUP AND PREPARATION
-- =============================================================================

-- Create test schema for isolation
DROP SCHEMA IF EXISTS test_multi_tenant CASCADE;
CREATE SCHEMA test_multi_tenant;
SET search_path TO test_multi_tenant, public;

-- Create temporary test users and organizations for testing
-- Note: In real testing, these would be actual auth.users entries
CREATE TEMP TABLE test_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT
);

CREATE TEMP TABLE test_organizations_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- Insert test data
INSERT INTO test_users (email, full_name) VALUES
  ('admin@company-a.com', 'Company A Admin'),
  ('user1@company-a.com', 'Company A User 1'),
  ('admin@company-b.com', 'Company B Admin'),
  ('user1@company-b.com', 'Company B User 1'),
  ('freelancer@personal.com', 'Personal Freelancer');

INSERT INTO test_organizations_setup (clerk_org_id, slug, name) VALUES
  ('org_company_a', 'company-a', 'Company A Inc'),
  ('org_company_b', 'company-b', 'Company B LLC');

-- =============================================================================
-- PART 2: ORGANIZATION TABLE TESTING
-- =============================================================================

-- Test 1: Organization Creation and Constraints
DO $$
DECLARE
  test_result BOOLEAN := TRUE;
  org_id UUID;
  error_message TEXT;
BEGIN
  RAISE NOTICE '=== TESTING ORGANIZATION CREATION ===';
  
  -- Test valid organization creation
  BEGIN
    INSERT INTO public.organizations (clerk_org_id, slug, name, description, plan)
    VALUES ('test_org_1', 'test-org-1', 'Test Organization 1', 'Test description', 'free')
    RETURNING id INTO org_id;
    
    RAISE NOTICE 'PASS: Organization created with ID %', org_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: Organization creation failed: %', SQLERRM;
    test_result := FALSE;
  END;
  
  -- Test invalid slug format (should fail)
  BEGIN
    INSERT INTO public.organizations (clerk_org_id, slug, name)
    VALUES ('test_org_invalid', 'Test Org!', 'Test Organization Invalid');
    
    RAISE WARNING 'FAIL: Invalid slug was accepted (should have failed)';
    test_result := FALSE;
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: Invalid slug correctly rejected';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: Unexpected error for invalid slug: %', SQLERRM;
  END;
  
  -- Test duplicate clerk_org_id (should fail)
  BEGIN
    INSERT INTO public.organizations (clerk_org_id, slug, name)
    VALUES ('test_org_1', 'different-slug', 'Different Name');
    
    RAISE WARNING 'FAIL: Duplicate clerk_org_id was accepted (should have failed)';
    test_result := FALSE;
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: Duplicate clerk_org_id correctly rejected';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: Unexpected error for duplicate clerk_org_id: %', SQLERRM;
  END;
  
  IF test_result THEN
    RAISE NOTICE 'RESULT: Organization table tests PASSED';
  ELSE
    RAISE WARNING 'RESULT: Organization table tests FAILED';
  END IF;
END;
$$;

-- =============================================================================
-- PART 3: ORGANIZATION MEMBERSHIP TESTING
-- =============================================================================

DO $$
DECLARE
  test_result BOOLEAN := TRUE;
  org_id UUID;
  user_id UUID;
  membership_id UUID;
BEGIN
  RAISE NOTICE '=== TESTING ORGANIZATION MEMBERSHIPS ===';
  
  -- Get test organization and user
  SELECT id INTO org_id FROM public.organizations WHERE clerk_org_id = 'test_org_1';
  SELECT id INTO user_id FROM test_users WHERE email = 'admin@company-a.com' LIMIT 1;
  
  -- Test membership creation
  BEGIN
    INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
    VALUES (org_id, user_id, 'admin', 'active')
    RETURNING id INTO membership_id;
    
    RAISE NOTICE 'PASS: Membership created with ID %', membership_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: Membership creation failed: %', SQLERRM;
    test_result := FALSE;
  END;
  
  -- Test duplicate membership (should fail due to unique constraint)
  BEGIN
    INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
    VALUES (org_id, user_id, 'member', 'active');
    
    RAISE WARNING 'FAIL: Duplicate membership was accepted (should have failed)';
    test_result := FALSE;
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: Duplicate membership correctly rejected';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: Unexpected error for duplicate membership: %', SQLERRM;
  END;
  
  -- Test invalid role (should fail)
  BEGIN
    INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
    VALUES (org_id, gen_random_uuid(), 'invalid_role', 'active');
    
    RAISE WARNING 'FAIL: Invalid role was accepted (should have failed)';
    test_result := FALSE;
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: Invalid role correctly rejected';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: Unexpected error for invalid role: %', SQLERRM;
  END;
  
  IF test_result THEN
    RAISE NOTICE 'RESULT: Organization membership tests PASSED';
  ELSE
    RAISE WARNING 'RESULT: Organization membership tests FAILED';
  END IF;
END;
$$;

-- =============================================================================
-- PART 4: HELPER FUNCTION TESTING
-- =============================================================================

DO $$
DECLARE
  test_result BOOLEAN := TRUE;
  org_context RECORD;
  user_id UUID;
  org_id UUID;
  is_member BOOLEAN;
  is_admin BOOLEAN;
BEGIN
  RAISE NOTICE '=== TESTING HELPER FUNCTIONS ===';
  
  -- Get test data
  SELECT id INTO user_id FROM test_users WHERE email = 'admin@company-a.com' LIMIT 1;
  SELECT id INTO org_id FROM public.organizations WHERE clerk_org_id = 'test_org_1';
  
  -- Test get_user_organization_context function
  BEGIN
    SELECT * INTO org_context FROM public.get_user_organization_context(user_id);
    
    IF org_context.organization_id = org_id THEN
      RAISE NOTICE 'PASS: get_user_organization_context returned correct org ID';
    ELSE
      RAISE WARNING 'FAIL: get_user_organization_context returned incorrect org ID';
      test_result := FALSE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: get_user_organization_context failed: %', SQLERRM;
    test_result := FALSE;
  END;
  
  -- Test is_organization_member function
  BEGIN
    SELECT public.is_organization_member(user_id, org_id) INTO is_member;
    
    IF is_member THEN
      RAISE NOTICE 'PASS: is_organization_member correctly identified membership';
    ELSE
      RAISE WARNING 'FAIL: is_organization_member failed to identify membership';
      test_result := FALSE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: is_organization_member function failed: %', SQLERRM;
    test_result := FALSE;
  END;
  
  -- Test is_organization_admin function
  BEGIN
    SELECT public.is_organization_admin(user_id, org_id) INTO is_admin;
    
    IF is_admin THEN
      RAISE NOTICE 'PASS: is_organization_admin correctly identified admin role';
    ELSE
      RAISE WARNING 'FAIL: is_organization_admin failed to identify admin role';
      test_result := FALSE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: is_organization_admin function failed: %', SQLERRM;
    test_result := FALSE;
  END;
  
  -- Test get_organization_by_slug function
  BEGIN
    SELECT COUNT(*) > 0 INTO is_member 
    FROM public.get_organization_by_slug('test-org-1');
    
    IF is_member THEN
      RAISE NOTICE 'PASS: get_organization_by_slug found organization';
    ELSE
      RAISE WARNING 'FAIL: get_organization_by_slug did not find organization';
      test_result := FALSE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: get_organization_by_slug function failed: %', SQLERRM;
    test_result := FALSE;
  END;
  
  IF test_result THEN
    RAISE NOTICE 'RESULT: Helper function tests PASSED';
  ELSE
    RAISE WARNING 'RESULT: Helper function tests FAILED';
  END IF;
END;
$$;

-- =============================================================================
-- PART 5: RLS POLICY TESTING (Requires actual auth context)
-- =============================================================================

-- Note: Full RLS testing requires actual authentication context
-- This provides basic structural tests

DO $$
DECLARE
  test_result BOOLEAN := TRUE;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== TESTING RLS POLICY STRUCTURE ===';
  
  -- Check that RLS is enabled on key tables
  SELECT COUNT(*) INTO policy_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname IN ('organizations', 'organization_memberships', 'audit_reports', 'automation_jobs')
    AND n.nspname = 'public'
    AND c.relrowsecurity = true;
  
  IF policy_count = 4 THEN
    RAISE NOTICE 'PASS: RLS enabled on all required tables';
  ELSE
    RAISE WARNING 'FAIL: RLS not enabled on all required tables (found % out of 4)', policy_count;
    test_result := FALSE;
  END IF;
  
  -- Check that policies exist for organizations table
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'organizations' AND schemaname = 'public';
  
  IF policy_count >= 4 THEN
    RAISE NOTICE 'PASS: Organization table has adequate policies (% policies)', policy_count;
  ELSE
    RAISE WARNING 'FAIL: Organization table has insufficient policies (% policies)', policy_count;
    test_result := FALSE;
  END IF;
  
  -- Check that service role policies exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND (cmd = 'ALL' OR policyname ILIKE '%service%role%');
  
  IF policy_count >= 4 THEN
    RAISE NOTICE 'PASS: Service role policies found (% policies)', policy_count;
  ELSE
    RAISE WARNING 'FAIL: Insufficient service role policies (% policies)', policy_count;
    test_result := FALSE;
  END IF;
  
  IF test_result THEN
    RAISE NOTICE 'RESULT: RLS policy structure tests PASSED';
  ELSE
    RAISE WARNING 'RESULT: RLS policy structure tests FAILED';
  END IF;
END;
$$;

-- =============================================================================
-- PART 6: INDEX PERFORMANCE TESTING
-- =============================================================================

DO $$
DECLARE
  test_result BOOLEAN := TRUE;
  index_count INTEGER;
  index_name TEXT;
BEGIN
  RAISE NOTICE '=== TESTING INDEX STRUCTURE ===';
  
  -- Check organization indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'organizations' 
    AND schemaname = 'public'
    AND indexname LIKE '%organizations_%';
  
  IF index_count >= 4 THEN
    RAISE NOTICE 'PASS: Organizations table has adequate indexes (% indexes)', index_count;
  ELSE
    RAISE WARNING 'FAIL: Organizations table has insufficient indexes (% indexes)', index_count;
    test_result := FALSE;
  END IF;
  
  -- Check organization_memberships indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'organization_memberships' 
    AND schemaname = 'public'
    AND indexname LIKE '%org_memberships_%';
  
  IF index_count >= 5 THEN
    RAISE NOTICE 'PASS: Organization memberships table has adequate indexes (% indexes)', index_count;
  ELSE
    RAISE WARNING 'FAIL: Organization memberships table has insufficient indexes (% indexes)', index_count;
    test_result := FALSE;
  END IF;
  
  -- Check that multi-tenant indexes were added to existing tables
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE schemaname = 'public'
    AND indexname LIKE '%organization_id%';
  
  IF index_count >= 3 THEN
    RAISE NOTICE 'PASS: Multi-tenant indexes added to existing tables (% indexes)', index_count;
  ELSE
    RAISE WARNING 'FAIL: Insufficient multi-tenant indexes on existing tables (% indexes)', index_count;
    test_result := FALSE;
  END IF;
  
  IF test_result THEN
    RAISE NOTICE 'RESULT: Index structure tests PASSED';
  ELSE
    RAISE WARNING 'RESULT: Index structure tests FAILED';
  END IF;
END;
$$;

-- =============================================================================
-- PART 7: DATA INTEGRITY AND FOREIGN KEY TESTING
-- =============================================================================

DO $$
DECLARE
  test_result BOOLEAN := TRUE;
  org_id UUID;
  user_id UUID;
BEGIN
  RAISE NOTICE '=== TESTING DATA INTEGRITY ===';
  
  -- Get test data
  SELECT id INTO org_id FROM public.organizations WHERE clerk_org_id = 'test_org_1';
  SELECT id INTO user_id FROM test_users WHERE email = 'admin@company-a.com' LIMIT 1;
  
  -- Test foreign key constraint on organization_memberships
  BEGIN
    INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
    VALUES (gen_random_uuid(), user_id, 'admin', 'active');
    
    RAISE WARNING 'FAIL: Invalid organization_id was accepted (should have failed)';
    test_result := FALSE;
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS: Invalid organization_id correctly rejected';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: Unexpected error for invalid organization_id: %', SQLERRM;
  END;
  
  -- Test that organization_id can be NULL in audit_reports (for personal reports)
  BEGIN
    -- This would require a real user_id from auth.users in practice
    -- For now, we just test the structure
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'audit_reports' 
        AND column_name = 'organization_id' 
        AND is_nullable = 'YES'
    ) THEN
      RAISE NOTICE 'PASS: audit_reports.organization_id allows NULL (for personal reports)';
    ELSE
      RAISE WARNING 'FAIL: audit_reports.organization_id should allow NULL';
      test_result := FALSE;
    END IF;
  END;
  
  -- Test cascade deletion behavior
  BEGIN
    -- Create a temporary organization for deletion test
    INSERT INTO public.organizations (clerk_org_id, slug, name)
    VALUES ('temp_delete_test', 'temp-delete', 'Temp Delete Test')
    RETURNING id INTO org_id;
    
    -- Create membership
    INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
    VALUES (org_id, user_id, 'admin', 'active');
    
    -- Delete organization (should cascade to memberships)
    DELETE FROM public.organizations WHERE id = org_id;
    
    -- Check that membership was deleted
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_memberships 
      WHERE organization_id = org_id
    ) THEN
      RAISE NOTICE 'PASS: CASCADE delete working correctly';
    ELSE
      RAISE WARNING 'FAIL: CASCADE delete not working';
      test_result := FALSE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: CASCADE delete test failed: %', SQLERRM;
    test_result := FALSE;
  END;
  
  IF test_result THEN
    RAISE NOTICE 'RESULT: Data integrity tests PASSED';
  ELSE
    RAISE WARNING 'RESULT: Data integrity tests FAILED';
  END IF;
END;
$$;

-- =============================================================================
-- PART 8: VIEW AND ANALYTICS TESTING
-- =============================================================================

DO $$
DECLARE
  test_result BOOLEAN := TRUE;
  view_count INTEGER;
  stat_record RECORD;
BEGIN
  RAISE NOTICE '=== TESTING VIEWS AND ANALYTICS ===';
  
  -- Test that updated views exist
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views 
  WHERE table_schema = 'public' 
    AND table_name IN ('audit_stats', 'organization_stats');
  
  IF view_count = 2 THEN
    RAISE NOTICE 'PASS: Required analytics views exist';
  ELSE
    RAISE WARNING 'FAIL: Missing analytics views (found % out of 2)', view_count;
    test_result := FALSE;
  END IF;
  
  -- Test audit_stats view structure
  BEGIN
    SELECT COUNT(*) INTO view_count FROM public.audit_stats WHERE FALSE;
    RAISE NOTICE 'PASS: audit_stats view is accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: audit_stats view error: %', SQLERRM;
    test_result := FALSE;
  END;
  
  -- Test organization_stats view structure  
  BEGIN
    SELECT COUNT(*) INTO view_count FROM public.organization_stats WHERE FALSE;
    RAISE NOTICE 'PASS: organization_stats view is accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL: organization_stats view error: %', SQLERRM;
    test_result := FALSE;
  END;
  
  IF test_result THEN
    RAISE NOTICE 'RESULT: Views and analytics tests PASSED';
  ELSE
    RAISE WARNING 'RESULT: Views and analytics tests FAILED';
  END IF;
END;
$$;

-- =============================================================================
-- PART 9: MIGRATION COMPLETENESS TESTING
-- =============================================================================

DO $$
DECLARE
  test_result BOOLEAN := TRUE;
  column_count INTEGER;
  table_name TEXT;
BEGIN
  RAISE NOTICE '=== TESTING MIGRATION COMPLETENESS ===';
  
  -- Check that organization_id column was added to all required tables
  FOR table_name IN VALUES ('profiles'), ('audit_reports'), ('automation_jobs'), ('generated_automations'), ('waitlist')
  LOOP
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = table_name 
      AND column_name = 'organization_id'
      AND table_schema = 'public';
    
    IF column_count = 1 THEN
      RAISE NOTICE 'PASS: organization_id column exists in %', table_name;
    ELSE
      RAISE WARNING 'FAIL: organization_id column missing in %', table_name;
      test_result := FALSE;
    END IF;
  END LOOP;
  
  -- Check that default organization exists
  IF EXISTS (SELECT 1 FROM public.organizations WHERE clerk_org_id = 'default-org') THEN
    RAISE NOTICE 'PASS: Default organization exists';
  ELSE
    RAISE WARNING 'FAIL: Default organization missing';
    test_result := FALSE;
  END IF;
  
  -- Check function dependencies
  SELECT COUNT(*) INTO column_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name IN (
      'get_user_organization_context',
      'is_organization_member', 
      'is_organization_admin',
      'get_organization_by_slug'
    );
  
  IF column_count = 4 THEN
    RAISE NOTICE 'PASS: All helper functions exist';
  ELSE
    RAISE WARNING 'FAIL: Missing helper functions (found % out of 4)', column_count;
    test_result := FALSE;
  END IF;
  
  IF test_result THEN
    RAISE NOTICE 'RESULT: Migration completeness tests PASSED';
  ELSE
    RAISE WARNING 'RESULT: Migration completeness tests FAILED';
  END IF;
END;
$$;

-- =============================================================================
-- PART 10: CLEANUP AND SUMMARY
-- =============================================================================

-- Clean up test data
DELETE FROM public.organization_memberships WHERE organization_id IN (
  SELECT id FROM public.organizations WHERE clerk_org_id LIKE 'test_%'
);
DELETE FROM public.organizations WHERE clerk_org_id LIKE 'test_%';

-- Clean up test schema
DROP SCHEMA IF EXISTS test_multi_tenant CASCADE;

-- Final summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'MULTI-TENANT MIGRATION TESTING COMPLETED';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Review the test results above for any FAILED tests.';
  RAISE NOTICE 'All PASSED tests indicate successful migration.';
  RAISE NOTICE 'For production deployment, run additional tests with:';
  RAISE NOTICE '1. Real authentication context for RLS testing';
  RAISE NOTICE '2. Performance testing with sample data';
  RAISE NOTICE '3. Load testing with concurrent operations';
  RAISE NOTICE '===============================================';
END;
$$;