/**
 * Multi-tenant Testing Utilities
 * ProcessAudit AI - Phase 4 Testing & Quality Assurance
 */

import { createClient } from '@supabase/supabase-js'
import { jest } from '@jest/globals'

/**
 * Test database setup and cleanup utilities
 */
export class TestDatabaseManager {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
    this.supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'test-service-key'
    this.client = createClient(this.supabaseUrl, this.supabaseKey)
    this.testDataIds = new Set()
  }

  async setupTestDatabase() {
    // Create test-specific schema if needed
    await this.client.rpc('create_test_schema', { schema_name: 'test_multitenant' })
    
    return true
  }

  async createTestOrganizations(organizations) {
    const createdOrgs = []
    
    for (const org of organizations) {
      // Create organization data in test database
      const { data, error } = await this.client
        .from('organizations')
        .insert({
          id: org.id,
          slug: org.slug,
          name: org.name,
          plan: org.plan,
          metadata: org.metadata || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.warn(`Failed to create test org ${org.id}:`, error)
      } else {
        this.testDataIds.add(`org_${data.id}`)
        createdOrgs.push(data)
      }
    }
    
    return createdOrgs
  }

  async createTestUsers(users) {
    const createdUsers = []
    
    for (const user of users) {
      const { data, error } = await this.client
        .from('test_users')
        .insert({
          id: user.id,
          email: user.email,
          organization_id: user.organizationId,
          role: user.role,
          metadata: user.metadata || {}
        })
        .select()
        .single()

      if (error) {
        console.warn(`Failed to create test user ${user.id}:`, error)
      } else {
        this.testDataIds.add(`user_${data.id}`)
        createdUsers.push(data)
      }
    }
    
    return createdUsers
  }

  async createTestAuditReports(reports) {
    const createdReports = []
    
    for (const report of reports) {
      const { data, error } = await this.client
        .from('audit_reports')
        .insert({
          id: report.id,
          organization_id: report.organizationId,
          user_id: report.userId,
          title: report.title,
          process_description: report.processDescription,
          analysis: report.analysis,
          status: report.status || 'completed',
          created_at: report.createdAt || new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.warn(`Failed to create test report ${report.id}:`, error)
      } else {
        this.testDataIds.add(`report_${data.id}`)
        createdReports.push(data)
      }
    }
    
    return createdReports
  }

  async createTestAutomationJobs(jobs) {
    const createdJobs = []
    
    for (const job of jobs) {
      const { data, error } = await this.client
        .from('automation_jobs')
        .insert({
          id: job.id,
          organization_id: job.organizationId,
          user_id: job.userId,
          status: job.status,
          job_type: job.jobType || 'n8n',
          progress: job.progress || 0,
          orchestration_plan: job.orchestrationPlan,
          result: job.result,
          created_at: job.createdAt || new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.warn(`Failed to create test job ${job.id}:`, error)
      } else {
        this.testDataIds.add(`job_${data.id}`)
        createdJobs.push(data)
      }
    }
    
    return createdJobs
  }

  async cleanupTestData() {
    // Clean up all test data
    const cleanupPromises = []
    
    // Delete audit reports
    cleanupPromises.push(
      this.client.from('audit_reports').delete().like('id', 'test_%')
    )
    
    // Delete automation jobs
    cleanupPromises.push(
      this.client.from('automation_jobs').delete().like('id', 'test_%')
    )
    
    // Delete generated automations
    cleanupPromises.push(
      this.client.from('generated_automations').delete().like('id', 'test_%')
    )
    
    // Delete test users
    cleanupPromises.push(
      this.client.from('test_users').delete().neq('id', 'keep')
    )
    
    // Delete test organizations
    cleanupPromises.push(
      this.client.from('organizations').delete().like('id', 'test_%')
    )

    await Promise.all(cleanupPromises)
    this.testDataIds.clear()
    
    return true
  }

  async verifyDataIsolation(organizationId, expectedDataCount) {
    const { data: reports } = await this.client
      .from('audit_reports')
      .select('*')
      .eq('organization_id', organizationId)

    const { data: jobs } = await this.client
      .from('automation_jobs')
      .select('*')
      .eq('organization_id', organizationId)

    return {
      reportsCount: reports?.length || 0,
      jobsCount: jobs?.length || 0,
      meetsExpected: (reports?.length || 0) === expectedDataCount.reports &&
                     (jobs?.length || 0) === expectedDataCount.jobs
    }
  }
}

/**
 * Mock Clerk client with organization support
 */
export class MockClerkManager {
  constructor() {
    this.organizations = new Map()
    this.users = new Map()
    this.memberships = new Map()
    this.mockClerkClient = this.createMockClient()
  }

  createMockClient() {
    return {
      organizations: {
        getOrganization: jest.fn((orgId) => {
          const org = this.organizations.get(orgId)
          return org ? Promise.resolve(org) : Promise.reject({ status: 404 })
        }),
        
        getOrganizationList: jest.fn(() => {
          return Promise.resolve({
            data: Array.from(this.organizations.values())
          })
        }),
        
        getOrganizationMembership: jest.fn((userId, orgId) => {
          const membershipKey = `${userId}_${orgId}`
          const membership = this.memberships.get(membershipKey)
          return membership ? Promise.resolve(membership) : Promise.reject({ status: 404 })
        }),

        getOrganizationMembershipList: jest.fn((orgId) => {
          const orgMemberships = Array.from(this.memberships.values())
            .filter(m => m.organization?.id === orgId)
          
          return Promise.resolve({
            data: orgMemberships,
            totalCount: orgMemberships.length
          })
        }),

        createOrganization: jest.fn((orgData) => {
          const org = {
            id: `org_${Date.now()}`,
            ...orgData,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
          this.organizations.set(org.id, org)
          return Promise.resolve(org)
        }),

        updateOrganization: jest.fn((orgId, updateData) => {
          const org = this.organizations.get(orgId)
          if (!org) return Promise.reject({ status: 404 })
          
          const updatedOrg = { ...org, ...updateData, updatedAt: Date.now() }
          this.organizations.set(orgId, updatedOrg)
          return Promise.resolve(updatedOrg)
        }),

        createOrganizationInvitation: jest.fn((orgId, invitationData) => {
          return Promise.resolve({
            id: `inv_${Date.now()}`,
            organizationId: orgId,
            ...invitationData,
            status: 'pending',
            createdAt: Date.now()
          })
        })
      },

      users: {
        getUser: jest.fn((userId) => {
          const user = this.users.get(userId)
          return user ? Promise.resolve(user) : Promise.reject({ status: 404 })
        }),

        updateUser: jest.fn((userId, updateData) => {
          const user = this.users.get(userId)
          if (!user) return Promise.reject({ status: 404 })
          
          const updatedUser = { ...user, ...updateData }
          this.users.set(userId, updatedUser)
          return Promise.resolve(updatedUser)
        }),

        getOrganizationMembershipList: jest.fn((userId) => {
          const userMemberships = Array.from(this.memberships.values())
            .filter(m => m.publicUserData?.userId === userId)
          
          return Promise.resolve({
            data: userMemberships,
            totalCount: userMemberships.length
          })
        })
      }
    }
  }

  addOrganization(org) {
    this.organizations.set(org.id, org)
    return org
  }

  addUser(user) {
    this.users.set(user.id, user)
    return user
  }

  addMembership(userId, orgId, membershipData) {
    const membership = {
      id: `membership_${userId}_${orgId}`,
      publicUserData: { userId },
      organization: this.organizations.get(orgId),
      ...membershipData
    }
    
    const membershipKey = `${userId}_${orgId}`
    this.memberships.set(membershipKey, membership)
    return membership
  }

  removeMembership(userId, orgId) {
    const membershipKey = `${userId}_${orgId}`
    return this.memberships.delete(membershipKey)
  }

  getAuthMock(userId, orgSlug = null) {
    return jest.fn().mockReturnValue({
      userId,
      orgSlug,
      orgId: orgSlug ? `org_${orgSlug}` : null
    })
  }

  reset() {
    this.organizations.clear()
    this.users.clear()
    this.memberships.clear()
    
    // Reset all mock functions
    Object.values(this.mockClerkClient.organizations).forEach(mock => mock.mockClear())
    Object.values(this.mockClerkClient.users).forEach(mock => mock.mockClear())
  }
}

/**
 * Test environment setup utilities
 */
export class TestEnvironmentManager {
  constructor() {
    this.originalEnv = { ...process.env }
    this.dbManager = new TestDatabaseManager()
    this.clerkManager = new MockClerkManager()
  }

  setupMultiTenantTestEnv() {
    // Set test environment variables
    process.env.NODE_ENV = 'test'
    process.env.NEXT_PUBLIC_USE_CLERK_AUTH = 'true'
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_multitenant'
    process.env.CLERK_SECRET_KEY = 'sk_test_multitenant'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test_service_key'
    process.env.CLOUDFLARE_WORKER_URL = 'https://test-worker.workers.dev'
    
    return {
      dbManager: this.dbManager,
      clerkManager: this.clerkManager
    }
  }

  async setupTestScenario(scenario) {
    const { organizations, users, reports, jobs } = scenario
    
    // Setup organizations
    if (organizations) {
      organizations.forEach(org => this.clerkManager.addOrganization(org))
      await this.dbManager.createTestOrganizations(organizations)
    }
    
    // Setup users
    if (users) {
      users.forEach(user => this.clerkManager.addUser(user))
      await this.dbManager.createTestUsers(users)
      
      // Setup memberships
      users.forEach(user => {
        if (user.organizationMemberships) {
          user.organizationMemberships.forEach(membership => {
            this.clerkManager.addMembership(
              user.id, 
              membership.organization.id, 
              membership
            )
          })
        }
      })
    }
    
    // Setup test data
    if (reports) {
      await this.dbManager.createTestAuditReports(reports)
    }
    
    if (jobs) {
      await this.dbManager.createTestAutomationJobs(jobs)
    }
    
    return true
  }

  async cleanupTestEnvironment() {
    // Cleanup database
    await this.dbManager.cleanupTestData()
    
    // Reset mocks
    this.clerkManager.reset()
    
    // Restore environment
    process.env = { ...this.originalEnv }
    
    return true
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestRunner {
  constructor() {
    this.metrics = []
  }

  async measureOperation(name, operation, iterations = 1) {
    const results = []
    
    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint()
      const startMemory = process.memoryUsage()
      
      try {
        const result = await operation()
        const endTime = process.hrtime.bigint()
        const endMemory = process.memoryUsage()
        
        const duration = Number(endTime - startTime) / 1000000 // ms
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed
        
        results.push({
          success: true,
          duration,
          memoryDelta,
          result
        })
      } catch (error) {
        const endTime = process.hrtime.bigint()
        const duration = Number(endTime - startTime) / 1000000
        
        results.push({
          success: false,
          duration,
          error: error.message
        })
      }
    }
    
    const metric = {
      name,
      iterations,
      results,
      avgDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      successRate: results.filter(r => r.success).length / results.length,
      avgMemoryDelta: results.reduce((sum, r) => sum + (r.memoryDelta || 0), 0) / results.length
    }
    
    this.metrics.push(metric)
    return metric
  }

  async measureConcurrent(name, operations, concurrency = 10) {
    const batches = []
    for (let i = 0; i < operations.length; i += concurrency) {
      batches.push(operations.slice(i, i + concurrency))
    }
    
    const batchResults = []
    
    for (const batch of batches) {
      const startTime = process.hrtime.bigint()
      const results = await Promise.allSettled(batch.map(op => op()))
      const endTime = process.hrtime.bigint()
      
      const batchDuration = Number(endTime - startTime) / 1000000
      const successCount = results.filter(r => r.status === 'fulfilled').length
      
      batchResults.push({
        batchSize: batch.length,
        duration: batchDuration,
        successCount,
        successRate: successCount / batch.length
      })
    }
    
    const metric = {
      name,
      type: 'concurrent',
      totalOperations: operations.length,
      concurrency,
      batches: batchResults,
      avgBatchDuration: batchResults.reduce((sum, b) => sum + b.duration, 0) / batchResults.length,
      overallSuccessRate: batchResults.reduce((sum, b) => sum + b.successCount, 0) / operations.length
    }
    
    this.metrics.push(metric)
    return metric
  }

  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      totalMetrics: this.metrics.length,
      metrics: this.metrics.map(metric => ({
        name: metric.name,
        avgDuration: metric.avgDuration,
        successRate: metric.successRate,
        type: metric.type || 'sequential'
      })),
      summary: {
        slowestOperation: this.metrics.reduce((slowest, current) => 
          current.avgDuration > (slowest?.avgDuration || 0) ? current : slowest, null),
        fastestOperation: this.metrics.reduce((fastest, current) => 
          current.avgDuration < (fastest?.avgDuration || Infinity) ? current : fastest, null),
        avgSuccessRate: this.metrics.reduce((sum, m) => sum + m.successRate, 0) / this.metrics.length
      }
    }
  }

  reset() {
    this.metrics = []
  }
}

/**
 * Multi-tenant test data generators
 */
export const generateTestOrganizations = (count = 3) => {
  const plans = ['free', 'professional', 'enterprise']
  return Array.from({ length: count }, (_, i) => ({
    id: `test_org_${i + 1}`,
    slug: `test-org-${i + 1}`,
    name: `Test Organization ${i + 1}`,
    plan: plans[i % plans.length],
    metadata: {
      industry: ['technology', 'healthcare', 'manufacturing'][i % 3],
      size: ['startup', 'medium', 'enterprise'][i % 3]
    }
  }))
}

export const generateTestUsers = (organizations) => {
  const users = []
  
  organizations.forEach((org, orgIndex) => {
    const userCount = org.plan === 'free' ? 3 : org.plan === 'professional' ? 8 : 15
    
    for (let i = 0; i < userCount; i++) {
      const user = {
        id: `test_user_${orgIndex}_${i}`,
        email: `user${i}@test-org-${orgIndex + 1}.example.com`,
        organizationId: org.id,
        role: i === 0 ? 'admin' : 'member',
        organizationMemberships: [{
          id: `membership_${orgIndex}_${i}`,
          organization: org,
          role: i === 0 ? 'admin' : 'member',
          permissions: i === 0 ? ['org:read', 'org:write', 'org:admin'] : ['org:read']
        }]
      }
      
      users.push(user)
    }
  })
  
  return users
}

export const generateTestReports = (organizations, users) => {
  const reports = []
  
  organizations.forEach(org => {
    const orgUsers = users.filter(u => u.organizationId === org.id)
    const reportCount = org.plan === 'free' ? 2 : org.plan === 'professional' ? 8 : 20
    
    for (let i = 0; i < reportCount; i++) {
      const user = orgUsers[i % orgUsers.length]
      
      reports.push({
        id: `test_report_${org.id}_${i}`,
        organizationId: org.id,
        userId: user.id,
        title: `Test Process ${i + 1}`,
        processDescription: `Test process description for ${org.name}`,
        analysis: {
          executiveSummary: `Analysis for ${org.name} process ${i + 1}`,
          automationOpportunities: [
            {
              title: 'Test Opportunity',
              description: 'Test automation opportunity',
              impact: 'Medium',
              effort: 'Low'
            }
          ]
        },
        status: 'completed',
        createdAt: new Date(Date.now() - i * 86400000).toISOString() // Spread over days
      })
    }
  })
  
  return reports
}

export const generateTestAutomationJobs = (organizations, users) => {
  const jobs = []
  
  organizations.forEach(org => {
    const orgUsers = users.filter(u => u.organizationId === org.id)
    const jobCount = org.plan === 'free' ? 5 : org.plan === 'professional' ? 15 : 40
    
    for (let i = 0; i < jobCount; i++) {
      const user = orgUsers[i % orgUsers.length]
      const statuses = ['completed', 'processing', 'failed']
      
      jobs.push({
        id: `test_job_${org.id}_${i}`,
        organizationId: org.id,
        userId: user.id,
        status: statuses[i % statuses.length],
        jobType: 'n8n',
        progress: statuses[i % statuses.length] === 'completed' ? 100 : 
                 statuses[i % statuses.length] === 'processing' ? Math.floor(Math.random() * 80) + 10 : 0,
        orchestrationPlan: {
          processTitle: `Automation ${i + 1}`,
          businessContext: {
            industry: org.metadata?.industry || 'technology',
            complexity: ['simple', 'medium', 'complex'][i % 3]
          }
        },
        result: statuses[i % statuses.length] === 'completed' ? {
          workflowData: {
            nodes: [
              { id: 'webhook', type: 'n8n-nodes-base.webhook', name: 'Webhook' },
              { id: 'process', type: 'n8n-nodes-base.function', name: 'Process Data' }
            ]
          }
        } : null,
        createdAt: new Date(Date.now() - i * 3600000).toISOString() // Spread over hours
      })
    }
  })
  
  return jobs
}