-- ProcessAudit AI - Existing Data Migration to Organizations
-- Phase 2: Data Migration Strategy
-- Migration: 20250904000003_migrate_existing_data_to_organizations

-- =============================================================================
-- PART 1: MIGRATION PREPARATION AND VALIDATION
-- =============================================================================

-- Check if default organization exists, create if not
INSERT INTO public.organizations (
  id,
  clerk_org_id,
  slug,
  name,
  description,
  plan,
  max_members,
  max_projects,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000'::UUID,
  'default-org',
  'default',
  'Default Organization',
  'Default organization for existing users and data migration',
  'free',
  1000, -- Higher limits for legacy data
  1000,
  NOW(),
  NOW()
) ON CONFLICT (clerk_org_id) DO UPDATE SET
  max_members = 1000,
  max_projects = 1000,
  updated_at = NOW();

-- =============================================================================
-- PART 2: CREATE MIGRATION TRACKING
-- =============================================================================

-- Create a temporary table to track migration progress
CREATE TEMP TABLE IF NOT EXISTS migration_progress (
  step TEXT PRIMARY KEY,
  total_records INTEGER DEFAULT 0,
  migrated_records INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT
);

-- Initialize migration tracking
INSERT INTO migration_progress (step) VALUES
  ('create_default_memberships'),
  ('migrate_audit_reports'),
  ('migrate_automation_jobs'),
  ('migrate_generated_automations'),
  ('migrate_profiles'),
  ('validate_migration')
ON CONFLICT (step) DO NOTHING;

-- =============================================================================
-- PART 3: MIGRATION HELPER FUNCTIONS
-- =============================================================================

-- Function to create default organization membership for existing users
CREATE OR REPLACE FUNCTION migrate_create_default_memberships()
RETURNS TABLE (
  user_id UUID,
  organization_id UUID,
  created BOOLEAN
) AS $$
DECLARE
  default_org_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
  user_record RECORD;
  created_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Update migration status
  UPDATE migration_progress 
  SET status = 'in_progress', total_records = (SELECT COUNT(*) FROM auth.users)
  WHERE step = 'create_default_memberships';

  -- Create memberships for all existing users who don't have any organization membership
  FOR user_record IN 
    SELECT u.id
    FROM auth.users u
    LEFT JOIN public.organization_memberships om ON u.id = om.user_id
    WHERE om.user_id IS NULL
  LOOP
    total_count := total_count + 1;
    
    BEGIN
      INSERT INTO public.organization_memberships (
        organization_id,
        user_id,
        role,
        status,
        created_at,
        updated_at
      ) VALUES (
        default_org_id,
        user_record.id,
        'admin', -- First users are admins of default org
        'active',
        NOW(),
        NOW()
      );
      
      created_count := created_count + 1;
      
      RETURN QUERY SELECT user_record.id, default_org_id, true;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue
      RAISE WARNING 'Failed to create membership for user %: %', user_record.id, SQLERRM;
      RETURN QUERY SELECT user_record.id, default_org_id, false;
    END;
  END LOOP;

  -- Update migration status
  UPDATE migration_progress 
  SET 
    status = 'completed',
    migrated_records = created_count,
    completed_at = NOW()
  WHERE step = 'create_default_memberships';

  RAISE NOTICE 'Created % memberships out of % users', created_count, total_count;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate audit reports to default organization
CREATE OR REPLACE FUNCTION migrate_audit_reports_to_default_org()
RETURNS TABLE (
  report_id UUID,
  user_id UUID,
  migrated BOOLEAN
) AS $$
DECLARE
  default_org_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
  report_record RECORD;
  migrated_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Update migration status
  UPDATE migration_progress 
  SET 
    status = 'in_progress', 
    total_records = (SELECT COUNT(*) FROM public.audit_reports WHERE organization_id IS NULL)
  WHERE step = 'migrate_audit_reports';

  -- Migrate all audit reports without organization_id
  FOR report_record IN 
    SELECT id, user_id
    FROM public.audit_reports
    WHERE organization_id IS NULL
  LOOP
    total_count := total_count + 1;
    
    BEGIN
      -- Only migrate if user has membership in default org
      IF EXISTS (
        SELECT 1 FROM public.organization_memberships 
        WHERE user_id = report_record.user_id 
          AND organization_id = default_org_id
          AND status = 'active'
      ) THEN
        UPDATE public.audit_reports 
        SET 
          organization_id = default_org_id,
          updated_at = NOW()
        WHERE id = report_record.id;
        
        migrated_count := migrated_count + 1;
        RETURN QUERY SELECT report_record.id, report_record.user_id, true;
      ELSE
        -- User doesn't have membership, skip this report
        RETURN QUERY SELECT report_record.id, report_record.user_id, false;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate audit report %: %', report_record.id, SQLERRM;
      RETURN QUERY SELECT report_record.id, report_record.user_id, false;
    END;
  END LOOP;

  -- Update migration status
  UPDATE migration_progress 
  SET 
    status = 'completed',
    migrated_records = migrated_count,
    completed_at = NOW()
  WHERE step = 'migrate_audit_reports';

  RAISE NOTICE 'Migrated % audit reports out of %', migrated_count, total_count;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate automation jobs to default organization
CREATE OR REPLACE FUNCTION migrate_automation_jobs_to_default_org()
RETURNS TABLE (
  job_id UUID,
  user_id UUID,
  migrated BOOLEAN
) AS $$
DECLARE
  default_org_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
  job_record RECORD;
  migrated_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Update migration status
  UPDATE migration_progress 
  SET 
    status = 'in_progress', 
    total_records = (SELECT COUNT(*) FROM public.automation_jobs WHERE organization_id IS NULL)
  WHERE step = 'migrate_automation_jobs';

  -- Migrate all automation jobs without organization_id
  FOR job_record IN 
    SELECT id, user_id
    FROM public.automation_jobs
    WHERE organization_id IS NULL
  LOOP
    total_count := total_count + 1;
    
    BEGIN
      -- Only migrate if user has membership in default org
      IF EXISTS (
        SELECT 1 FROM public.organization_memberships 
        WHERE user_id = job_record.user_id 
          AND organization_id = default_org_id
          AND status = 'active'
      ) THEN
        UPDATE public.automation_jobs 
        SET 
          organization_id = default_org_id,
          updated_at = NOW()
        WHERE id = job_record.id;
        
        migrated_count := migrated_count + 1;
        RETURN QUERY SELECT job_record.id, job_record.user_id, true;
      ELSE
        RETURN QUERY SELECT job_record.id, job_record.user_id, false;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate automation job %: %', job_record.id, SQLERRM;
      RETURN QUERY SELECT job_record.id, job_record.user_id, false;
    END;
  END LOOP;

  -- Update migration status
  UPDATE migration_progress 
  SET 
    status = 'completed',
    migrated_records = migrated_count,
    completed_at = NOW()
  WHERE step = 'migrate_automation_jobs';

  RAISE NOTICE 'Migrated % automation jobs out of %', migrated_count, total_count;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate generated automations via job relationship
CREATE OR REPLACE FUNCTION migrate_generated_automations_to_default_org()
RETURNS TABLE (
  automation_id UUID,
  job_id UUID,
  migrated BOOLEAN
) AS $$
DECLARE
  default_org_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
  automation_record RECORD;
  migrated_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Update migration status
  UPDATE migration_progress 
  SET 
    status = 'in_progress',
    total_records = (SELECT COUNT(*) FROM public.generated_automations WHERE organization_id IS NULL)
  WHERE step = 'migrate_generated_automations';

  -- Migrate generated automations based on their job's organization
  FOR automation_record IN 
    SELECT ga.id, ga.job_id, aj.organization_id as job_org_id
    FROM public.generated_automations ga
    JOIN public.automation_jobs aj ON ga.job_id = aj.id
    WHERE ga.organization_id IS NULL
  LOOP
    total_count := total_count + 1;
    
    BEGIN
      UPDATE public.generated_automations 
      SET organization_id = COALESCE(automation_record.job_org_id, default_org_id)
      WHERE id = automation_record.id;
      
      migrated_count := migrated_count + 1;
      RETURN QUERY SELECT automation_record.id, automation_record.job_id, true;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate generated automation %: %', automation_record.id, SQLERRM;
      RETURN QUERY SELECT automation_record.id, automation_record.job_id, false;
    END;
  END LOOP;

  -- Update migration status
  UPDATE migration_progress 
  SET 
    status = 'completed',
    migrated_records = migrated_count,
    completed_at = NOW()
  WHERE step = 'migrate_generated_automations';

  RAISE NOTICE 'Migrated % generated automations out of %', migrated_count, total_count;
END;
$$ LANGUAGE plpgsql;

-- Function to optionally migrate profiles to default organization
CREATE OR REPLACE FUNCTION migrate_profiles_to_default_org()
RETURNS TABLE (
  profile_id UUID,
  migrated BOOLEAN
) AS $$
DECLARE
  default_org_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
  profile_record RECORD;
  migrated_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Update migration status
  UPDATE migration_progress 
  SET 
    status = 'in_progress',
    total_records = (
      SELECT COUNT(*) 
      FROM public.profiles p
      WHERE p.organization_id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.organization_memberships om
          WHERE om.user_id = p.id AND om.organization_id = default_org_id
        )
    )
  WHERE step = 'migrate_profiles';

  -- Optionally migrate profiles to default org (only if user is member)
  FOR profile_record IN 
    SELECT p.id
    FROM public.profiles p
    WHERE p.organization_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.organization_memberships om
        WHERE om.user_id = p.id 
          AND om.organization_id = default_org_id
          AND om.status = 'active'
      )
  LOOP
    total_count := total_count + 1;
    
    BEGIN
      UPDATE public.profiles 
      SET 
        organization_id = default_org_id,
        updated_at = NOW()
      WHERE id = profile_record.id;
      
      migrated_count := migrated_count + 1;
      RETURN QUERY SELECT profile_record.id, true;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate profile %: %', profile_record.id, SQLERRM;
      RETURN QUERY SELECT profile_record.id, false;
    END;
  END LOOP;

  -- Update migration status
  UPDATE migration_progress 
  SET 
    status = 'completed',
    migrated_records = migrated_count,
    completed_at = NOW()
  WHERE step = 'migrate_profiles';

  RAISE NOTICE 'Migrated % profiles out of %', migrated_count, total_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PART 4: EXECUTE MIGRATION IN ORDER
-- =============================================================================

-- Step 1: Create default organization memberships for existing users
SELECT migrate_create_default_memberships();

-- Step 2: Migrate audit reports to default organization
SELECT migrate_audit_reports_to_default_org();

-- Step 3: Migrate automation jobs to default organization
SELECT migrate_automation_jobs_to_default_org();

-- Step 4: Migrate generated automations to default organization
SELECT migrate_generated_automations_to_default_org();

-- Step 5: Optionally migrate profiles to default organization
SELECT migrate_profiles_to_default_org();

-- =============================================================================
-- PART 5: MIGRATION VALIDATION
-- =============================================================================

-- Update validation status
UPDATE migration_progress 
SET status = 'in_progress', total_records = 6
WHERE step = 'validate_migration';

-- Validation queries and reports
DO $$
DECLARE
  validation_errors TEXT := '';
  users_without_membership INTEGER;
  reports_without_org INTEGER;
  jobs_without_org INTEGER;
  automations_without_org INTEGER;
BEGIN
  -- Check 1: All users should have at least one organization membership
  SELECT COUNT(*) INTO users_without_membership
  FROM auth.users u
  LEFT JOIN public.organization_memberships om ON u.id = om.user_id AND om.status = 'active'
  WHERE om.user_id IS NULL;
  
  IF users_without_membership > 0 THEN
    validation_errors := validation_errors || format('Found %s users without organization membership. ', users_without_membership);
  END IF;

  -- Check 2: Audit reports should have organization context where user has membership
  SELECT COUNT(*) INTO reports_without_org
  FROM public.audit_reports ar
  JOIN auth.users u ON ar.user_id = u.id
  LEFT JOIN public.organization_memberships om ON u.id = om.user_id AND om.status = 'active'
  WHERE ar.organization_id IS NULL AND om.user_id IS NOT NULL;
  
  IF reports_without_org > 0 THEN
    validation_errors := validation_errors || format('Found %s audit reports without organization context. ', reports_without_org);
  END IF;

  -- Check 3: Automation jobs should have organization context where user has membership
  SELECT COUNT(*) INTO jobs_without_org
  FROM public.automation_jobs aj
  JOIN auth.users u ON aj.user_id = u.id
  LEFT JOIN public.organization_memberships om ON u.id = om.user_id AND om.status = 'active'
  WHERE aj.organization_id IS NULL AND om.user_id IS NOT NULL;
  
  IF jobs_without_org > 0 THEN
    validation_errors := validation_errors || format('Found %s automation jobs without organization context. ', jobs_without_org);
  END IF;

  -- Check 4: Generated automations should have organization context
  SELECT COUNT(*) INTO automations_without_org
  FROM public.generated_automations ga
  WHERE ga.organization_id IS NULL;
  
  IF automations_without_org > 0 THEN
    validation_errors := validation_errors || format('Found %s generated automations without organization context. ', automations_without_org);
  END IF;

  -- Update validation status
  IF LENGTH(validation_errors) > 0 THEN
    UPDATE migration_progress 
    SET 
      status = 'failed',
      error_message = validation_errors,
      completed_at = NOW()
    WHERE step = 'validate_migration';
    
    RAISE WARNING 'Migration validation failed: %', validation_errors;
  ELSE
    UPDATE migration_progress 
    SET 
      status = 'completed',
      migrated_records = 6,
      completed_at = NOW()
    WHERE step = 'validate_migration';
    
    RAISE NOTICE 'Migration validation completed successfully';
  END IF;
END;
$$;

-- =============================================================================
-- PART 6: MIGRATION SUMMARY AND REPORTING
-- =============================================================================

-- Display final migration summary
SELECT 
  step,
  total_records,
  migrated_records,
  status,
  EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds,
  error_message
FROM migration_progress 
ORDER BY started_at;

-- Display organization membership summary
SELECT 
  o.name as organization,
  COUNT(om.id) as total_members,
  COUNT(CASE WHEN om.role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN om.role = 'member' THEN 1 END) as members,
  COUNT(CASE WHEN om.status = 'active' THEN 1 END) as active_members
FROM public.organizations o
LEFT JOIN public.organization_memberships om ON o.id = om.organization_id
GROUP BY o.id, o.name
ORDER BY total_members DESC;

-- Display data distribution summary
SELECT 
  COALESCE(o.name, 'No Organization') as organization,
  COUNT(DISTINCT ar.id) as audit_reports,
  COUNT(DISTINCT aj.id) as automation_jobs,
  COUNT(DISTINCT ga.id) as generated_automations,
  COUNT(DISTINCT p.id) as profiles
FROM public.organizations o
LEFT JOIN public.audit_reports ar ON o.id = ar.organization_id
LEFT JOIN public.automation_jobs aj ON o.id = aj.organization_id
LEFT JOIN public.generated_automations ga ON o.id = ga.organization_id
LEFT JOIN public.profiles p ON o.id = p.organization_id
GROUP BY o.id, o.name
UNION ALL
SELECT 
  'Personal/Unassigned' as organization,
  (SELECT COUNT(*) FROM public.audit_reports WHERE organization_id IS NULL),
  (SELECT COUNT(*) FROM public.automation_jobs WHERE organization_id IS NULL),
  (SELECT COUNT(*) FROM public.generated_automations WHERE organization_id IS NULL),
  (SELECT COUNT(*) FROM public.profiles WHERE organization_id IS NULL)
ORDER BY organization;

-- Clean up migration helper functions (they're only needed during migration)
DROP FUNCTION IF EXISTS migrate_create_default_memberships();
DROP FUNCTION IF EXISTS migrate_audit_reports_to_default_org();
DROP FUNCTION IF EXISTS migrate_automation_jobs_to_default_org();
DROP FUNCTION IF EXISTS migrate_generated_automations_to_default_org();
DROP FUNCTION IF EXISTS migrate_profiles_to_default_org();

RAISE NOTICE 'Migration to multi-tenant organizations completed. Check the summary reports above.';