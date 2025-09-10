# ProcessAudit AI - Multi-Tenant Database Migration Runbook
**Phase 2: Database Schema Migration for Organization Support**

## Overview

This runbook provides step-by-step instructions for migrating ProcessAudit AI from a single-tenant to a multi-tenant architecture with organization support. The migration includes database schema changes, RLS policy updates, data migration, and Workers integration updates.

## Migration Architecture

### Core Changes
- **New Tables**: `organizations`, `organization_memberships`
- **Schema Updates**: Add `organization_id` columns to existing tables
- **RLS Updates**: Organization-based data isolation policies
- **Workers Integration**: Organization-aware database functions
- **Performance**: Optimized indexes for multi-tenant queries

### Data Flow
```
Single-Tenant (Before)    →    Multi-Tenant (After)
user → audit_reports      →    user → organization → audit_reports
user → automation_jobs    →    user → organization → automation_jobs
```

## Pre-Migration Checklist

### 1. Environment Preparation
- [ ] Backup production database
- [ ] Verify Supabase project access
- [ ] Confirm service role key availability
- [ ] Test migration on staging environment
- [ ] Notify users of maintenance window

### 2. Code Preparation
- [ ] Frontend organization components deployed
- [ ] API routes updated for organization context
- [ ] TypeScript types available
- [ ] Workers code ready for deployment

### 3. Data Assessment
```sql
-- Run these queries to assess current data
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_reports FROM public.audit_reports;
SELECT COUNT(*) as total_jobs FROM public.automation_jobs;
SELECT COUNT(*) as total_automations FROM public.generated_automations;
```

## Migration Execution Steps

### Step 1: Schema Migration (15-30 minutes)

Execute the migration scripts in order:

```bash
# 1. Apply core schema changes
psql -d postgres -f supabase/migrations/20250904000001_add_multi_tenant_organizations.sql

# 2. Apply RLS policies  
psql -d postgres -f supabase/migrations/20250904000002_add_organization_rls_policies.sql

# 3. Migrate existing data
psql -d postgres -f supabase/migrations/20250904000003_migrate_existing_data_to_organizations.sql
```

**Expected Output:**
- Organizations table created with default organization
- All existing users added to default organization  
- All existing data migrated to default organization
- RLS policies applied with organization context

### Step 2: Validation Testing (10-15 minutes)

```bash
# Run comprehensive database tests
psql -d postgres -f database/test-multi-tenant-migration.sql

# Expected: All tests should PASS
# Look for: "RESULT: [Test Category] tests PASSED"
```

### Step 3: Workers Deployment (5-10 minutes)

```bash
# Deploy updated Workers with organization support
cd workers
npm run deploy

# Test Workers database integration
node test-organization-database.js
```

### Step 4: Application Deployment (10-15 minutes)

```bash
# Deploy main application (automatic via Vercel)
# Verify environment variables include:
# - SUPABASE_SERVICE_KEY (for Workers access)
# - All existing variables remain unchanged
```

### Step 5: Post-Migration Validation (10-15 minutes)

1. **Database Validation**
```sql
-- Verify organizations exist
SELECT COUNT(*) FROM public.organizations;

-- Verify memberships created
SELECT COUNT(*) FROM public.organization_memberships;

-- Check data migration
SELECT 
  COALESCE(o.name, 'Personal') as context,
  COUNT(*) as reports
FROM public.audit_reports ar
LEFT JOIN public.organizations o ON ar.organization_id = o.id
GROUP BY o.name;
```

2. **Application Testing**
- [ ] User can log in successfully
- [ ] Process audit flow works end-to-end  
- [ ] Automation generation works
- [ ] Reports are visible and accessible
- [ ] No console errors in browser

3. **Workers Testing**
```bash
cd workers
node test-organization-database.js
# Should show: "✅ All tests passed!"
```

## Rollback Procedures

### Emergency Rollback (if issues occur)

**⚠️ WARNING: This will delete all organization data**

```bash
# Only use if migration fails catastrophically
psql -d postgres -f supabase/migrations/rollback-multi-tenant-organizations.sql

# Redeploy previous version of Workers
cd workers
git checkout HEAD~1  # Go to previous version
npm run deploy

# Redeploy previous version of main app
# Use Vercel rollback or git revert
```

### Partial Rollback Options

1. **RLS Policy Issues**
   - Temporarily disable RLS: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
   - Fix policies and re-enable: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

2. **Workers Issues**
   - Redeploy previous Workers version
   - Update environment to skip organization features

3. **Performance Issues**
   - Drop non-critical indexes temporarily
   - Add them back during off-peak hours

## Monitoring and Maintenance

### Performance Monitoring

```sql
-- Monitor query performance
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE indexname LIKE '%organization%'
ORDER BY idx_tup_read DESC;

-- Monitor organization growth
SELECT * FROM public.organization_stats;
```

### Health Checks

```bash
# Daily health check queries
SELECT COUNT(*) as total_orgs FROM public.organizations;
SELECT COUNT(*) as active_memberships FROM public.organization_memberships WHERE status = 'active';

# Weekly performance check
EXPLAIN ANALYZE SELECT * FROM audit_reports WHERE organization_id = 'some-uuid';
```

## Troubleshooting Guide

### Common Issues

1. **"Organizations table already exists"**
   - Check if migration was partially run
   - Use `DROP TABLE IF EXISTS` approach
   - Verify foreign key constraints

2. **RLS Policy Errors**
   - Check auth.uid() availability in context
   - Verify service role has bypass permissions
   - Test policies with actual user tokens

3. **Data Migration Incomplete**  
   - Check migration_progress temp table
   - Re-run specific migration functions
   - Manually assign users to default organization

4. **Workers Can't Access Database**
   - Verify SUPABASE_SERVICE_KEY in Workers environment
   - Check service role RLS policies
   - Test database connection from Workers

5. **Performance Degradation**
   - Check if indexes were created successfully
   - Run ANALYZE on modified tables
   - Monitor query execution plans

### Debug Queries

```sql
-- Check migration status
SELECT * FROM migration_progress ORDER BY started_at;

-- Find users without organization membership
SELECT u.id, u.email 
FROM auth.users u
LEFT JOIN public.organization_memberships om ON u.id = om.user_id
WHERE om.user_id IS NULL;

-- Check RLS policy coverage
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Verify data distribution
SELECT 
  COALESCE(o.name, 'Unassigned') as organization,
  COUNT(DISTINCT ar.id) as reports,
  COUNT(DISTINCT aj.id) as jobs
FROM public.organizations o
LEFT JOIN public.audit_reports ar ON o.id = ar.organization_id
LEFT JOIN public.automation_jobs aj ON o.id = aj.organization_id
GROUP BY o.id, o.name;
```

## Success Criteria

### Technical Success
- [ ] All migration scripts execute without errors
- [ ] All validation tests pass
- [ ] RLS policies properly isolate organization data
- [ ] Workers can access organization context
- [ ] Application functions normally with organization features

### Performance Success
- [ ] Query performance maintains SLA (< 500ms for typical operations)
- [ ] Database size increase is reasonable (< 10% for schema changes)
- [ ] Index usage is optimal for multi-tenant queries
- [ ] No blocking locks during migration

### User Experience Success
- [ ] Existing users can access all their historical data
- [ ] New organization features work as expected
- [ ] No data loss or corruption
- [ ] Backwards compatibility maintained during transition

## Post-Migration Tasks

### Immediate (Day 1)
- [ ] Monitor application performance and error rates
- [ ] Verify user authentication and data access
- [ ] Check Workers processing organization context
- [ ] Review database connection pool usage

### Week 1
- [ ] Analyze query performance with real usage patterns
- [ ] Optimize indexes based on actual query patterns
- [ ] Implement organization-specific features in UI
- [ ] Train support team on organization concepts

### Month 1
- [ ] Review organization adoption metrics
- [ ] Optimize database based on usage patterns
- [ ] Implement advanced organization features
- [ ] Plan for organization-specific customizations

## Contacts and Escalation

### Development Team
- **Database Issues**: Backend Architect
- **Workers Issues**: Cloudflare Workers Specialist  
- **Frontend Issues**: Full-Stack Developer
- **Infrastructure Issues**: DevOps/Platform Team

### Escalation Path
1. **Level 1**: Development team member
2. **Level 2**: Technical lead + Database administrator
3. **Level 3**: CTO + External database consultant

### Emergency Contacts
- **Database Emergency**: [Database Administrator Contact]
- **Infrastructure Emergency**: [Platform Team Contact]
- **Business Critical**: [Technical Leadership Contact]

---

## Migration Checklist Summary

**Pre-Migration:**
- [ ] Database backup completed
- [ ] Staging environment tested
- [ ] Code deployed and ready
- [ ] Maintenance window scheduled

**Migration:**
- [ ] Schema migration executed
- [ ] RLS policies applied
- [ ] Data migration completed
- [ ] Validation tests passed

**Post-Migration:**
- [ ] Workers deployed and tested
- [ ] Application deployed and verified
- [ ] Performance monitoring active
- [ ] User acceptance validated

**Documentation:**
- [ ] Migration results documented
- [ ] Performance metrics recorded
- [ ] Known issues logged
- [ ] Team briefed on new architecture

---

*Migration Runbook Version: 1.0*  
*Last Updated: September 4, 2025*  
*Next Review: Post-migration + 30 days*