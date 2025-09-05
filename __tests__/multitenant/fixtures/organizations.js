/**
 * Multi-tenant test fixtures for organizations
 * ProcessAudit AI - Phase 4 Testing & Quality Assurance
 */

export const mockOrganizations = {
  freeOrg: {
    id: 'org_free_123',
    slug: 'startup-inc',
    name: 'Startup Inc',
    imageUrl: '',
    publicMetadata: {
      description: 'A growing startup',
      website: 'https://startup.example.com',
      industry: 'technology'
    },
    privateMetadata: {
      plan: 'free',
      features: {
        enableAutomations: true,
        enableReporting: true,
        enableIntegrations: false,
        enableAnalytics: false,
        maxProjects: 5,
        maxMembers: 5,
        maxWorkflows: 10,
        maxDataExports: 1
      },
      security: {
        requireTwoFactor: false,
        allowGuestAccess: true,
        sessionTimeout: 24,
        allowPublicReports: false
      },
      notifications: {
        emailNotifications: true,
        slackIntegration: false,
        webhookUrl: null
      },
      branding: {
        primaryColor: '#3b82f6',
        secondaryColor: '#6b7280',
        logo: null,
        customDomain: null
      },
      usage: {
        currentProjects: 2,
        currentMembers: 3,
        monthlyWorkflows: 8,
        storageUsed: 0.5 // GB
      }
    },
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
    maxAllowedMemberships: 5
  },

  professionalOrg: {
    id: 'org_pro_456',
    slug: 'acme-corp',
    name: 'Acme Corporation',
    imageUrl: 'https://example.com/acme-logo.png',
    publicMetadata: {
      description: 'Leading technology solutions provider',
      website: 'https://acme.example.com',
      industry: 'technology'
    },
    privateMetadata: {
      plan: 'professional',
      features: {
        enableAutomations: true,
        enableReporting: true,
        enableIntegrations: true,
        enableAnalytics: true,
        maxProjects: 50,
        maxMembers: 25,
        maxWorkflows: 100,
        maxDataExports: 10
      },
      security: {
        requireTwoFactor: true,
        allowGuestAccess: false,
        sessionTimeout: 8,
        allowPublicReports: true
      },
      notifications: {
        emailNotifications: true,
        slackIntegration: true,
        webhookUrl: 'https://hooks.slack.com/acme'
      },
      branding: {
        primaryColor: '#ff6b35',
        secondaryColor: '#374151',
        logo: 'https://example.com/acme-logo.png',
        customDomain: 'acme.processaudit.ai'
      },
      usage: {
        currentProjects: 23,
        currentMembers: 18,
        monthlyWorkflows: 87,
        storageUsed: 12.3 // GB
      }
    },
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
    maxAllowedMemberships: 25
  },

  enterpriseOrg: {
    id: 'org_ent_789',
    slug: 'global-corp',
    name: 'Global Corporation',
    imageUrl: 'https://example.com/global-logo.png',
    publicMetadata: {
      description: 'Fortune 500 multinational corporation',
      website: 'https://global.example.com',
      industry: 'manufacturing'
    },
    privateMetadata: {
      plan: 'enterprise',
      features: {
        enableAutomations: true,
        enableReporting: true,
        enableIntegrations: true,
        enableAnalytics: true,
        enableCustomFields: true,
        enableAPIAccess: true,
        maxProjects: 1000,
        maxMembers: 500,
        maxWorkflows: 1000,
        maxDataExports: 50
      },
      security: {
        requireTwoFactor: true,
        allowGuestAccess: false,
        sessionTimeout: 4,
        allowPublicReports: false,
        ssoRequired: true,
        ipWhitelist: ['203.0.113.0/24', '198.51.100.0/24']
      },
      notifications: {
        emailNotifications: true,
        slackIntegration: true,
        microsoftTeams: true,
        webhookUrl: 'https://global.example.com/webhooks/processaudit'
      },
      branding: {
        primaryColor: '#1f2937',
        secondaryColor: '#f59e0b',
        logo: 'https://example.com/global-logo.png',
        customDomain: 'process.global.com'
      },
      usage: {
        currentProjects: 247,
        currentMembers: 156,
        monthlyWorkflows: 892,
        storageUsed: 245.7 // GB
      }
    },
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
    maxAllowedMemberships: 500
  }
}

export const mockUsers = {
  freeUser: {
    id: 'user_free_123',
    firstName: 'John',
    lastName: 'Startup',
    emailAddresses: [{ emailAddress: 'john@startup.example.com' }],
    organizationMemberships: [{
      id: 'membership_free',
      organization: mockOrganizations.freeOrg,
      role: 'admin',
      permissions: ['org:read', 'org:write']
    }]
  },

  proAdmin: {
    id: 'user_pro_admin',
    firstName: 'Sarah',
    lastName: 'Manager',
    emailAddresses: [{ emailAddress: 'sarah@acme.example.com' }],
    organizationMemberships: [{
      id: 'membership_pro_admin',
      organization: mockOrganizations.professionalOrg,
      role: 'admin',
      permissions: ['org:read', 'org:write', 'org:admin']
    }]
  },

  proMember: {
    id: 'user_pro_member',
    firstName: 'Mike',
    lastName: 'Developer',
    emailAddresses: [{ emailAddress: 'mike@acme.example.com' }],
    organizationMemberships: [{
      id: 'membership_pro_member',
      organization: mockOrganizations.professionalOrg,
      role: 'member',
      permissions: ['org:read']
    }]
  },

  enterpriseAdmin: {
    id: 'user_ent_admin',
    firstName: 'Lisa',
    lastName: 'Director',
    emailAddresses: [{ emailAddress: 'lisa@global.example.com' }],
    organizationMemberships: [{
      id: 'membership_ent_admin',
      organization: mockOrganizations.enterpriseOrg,
      role: 'admin',
      permissions: ['org:read', 'org:write', 'org:admin', 'org:billing']
    }]
  },

  crossOrgUser: {
    id: 'user_cross_org',
    firstName: 'Alex',
    lastName: 'Consultant',
    emailAddresses: [{ emailAddress: 'alex@consultant.example.com' }],
    organizationMemberships: [
      {
        id: 'membership_cross_pro',
        organization: mockOrganizations.professionalOrg,
        role: 'member',
        permissions: ['org:read']
      },
      {
        id: 'membership_cross_ent',
        organization: mockOrganizations.enterpriseOrg,
        role: 'member',
        permissions: ['org:read']
      }
    ]
  }
}

export const mockAuditReports = {
  freeOrgReport: {
    id: 'report_free_123',
    organizationId: 'org_free_123',
    userId: 'user_free_123',
    title: 'Customer Onboarding Process',
    processDescription: 'Manual customer onboarding workflow',
    analysis: {
      executiveSummary: 'Basic onboarding process with automation opportunities',
      automationOpportunities: [
        {
          title: 'Email Automation',
          description: 'Automate welcome emails',
          impact: 'Medium',
          effort: 'Low'
        }
      ]
    },
    status: 'completed',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },

  proOrgReport: {
    id: 'report_pro_456',
    organizationId: 'org_pro_456',
    userId: 'user_pro_admin',
    title: 'Sales Lead Management',
    processDescription: 'Complex sales lead tracking and nurturing',
    analysis: {
      executiveSummary: 'Multi-stage sales process with significant automation potential',
      automationOpportunities: [
        {
          title: 'CRM Integration',
          description: 'Automate lead scoring and routing',
          impact: 'High',
          effort: 'Medium'
        },
        {
          title: 'Email Sequences',
          description: 'Automated drip campaigns',
          impact: 'High',
          effort: 'Low'
        }
      ]
    },
    status: 'completed',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  }
}

export const mockAutomationJobs = {
  freeOrgJob: {
    id: 'job_free_123',
    organizationId: 'org_free_123',
    userId: 'user_free_123',
    status: 'completed',
    job_type: 'n8n',
    progress: 100,
    orchestration_plan: {
      processTitle: 'Email Newsletter Automation',
      businessContext: {
        industry: 'technology',
        volume: 'low',
        complexity: 'simple'
      }
    },
    result: {
      workflowData: {
        nodes: [
          { id: 'webhook', type: 'n8n-nodes-base.webhook', name: 'Webhook' },
          { id: 'email', type: 'n8n-nodes-base.emailSend', name: 'Send Email' }
        ],
        connections: {
          webhook: { main: [[{ node: 'email', type: 'main', index: 0 }]] }
        }
      }
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },

  proOrgJob: {
    id: 'job_pro_456',
    organizationId: 'org_pro_456',
    userId: 'user_pro_admin',
    status: 'completed',
    job_type: 'n8n',
    progress: 100,
    orchestration_plan: {
      processTitle: 'CRM Lead Processing',
      businessContext: {
        industry: 'technology',
        volume: 'high',
        complexity: 'complex'
      }
    },
    result: {
      workflowData: {
        nodes: [
          { id: 'webhook', type: 'n8n-nodes-base.webhook', name: 'New Lead' },
          { id: 'crm', type: 'n8n-nodes-base.hubspot', name: 'Add to HubSpot' },
          { id: 'slack', type: 'n8n-nodes-base.slack', name: 'Notify Team' }
        ],
        connections: {
          webhook: { main: [[{ node: 'crm', type: 'main', index: 0 }]] },
          crm: { main: [[{ node: 'slack', type: 'main', index: 0 }]] }
        }
      }
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  }
}

/**
 * Plan-based feature restrictions for testing
 */
export const planFeatures = {
  free: {
    maxProjects: 5,
    maxMembers: 5,
    maxWorkflows: 10,
    enableIntegrations: false,
    enableAnalytics: false,
    enableCustomFields: false,
    enableAPIAccess: false,
    supportLevel: 'community'
  },
  professional: {
    maxProjects: 50,
    maxMembers: 25,
    maxWorkflows: 100,
    enableIntegrations: true,
    enableAnalytics: true,
    enableCustomFields: false,
    enableAPIAccess: true,
    supportLevel: 'priority'
  },
  enterprise: {
    maxProjects: 1000,
    maxMembers: 500,
    maxWorkflows: 1000,
    enableIntegrations: true,
    enableAnalytics: true,
    enableCustomFields: true,
    enableAPIAccess: true,
    supportLevel: 'dedicated'
  }
}

/**
 * Database seeding helper for tests
 */
export const seedTestData = async (supabaseClient) => {
  // Insert audit reports
  await supabaseClient
    .from('audit_reports')
    .insert([mockAuditReports.freeOrgReport, mockAuditReports.proOrgReport])

  // Insert automation jobs
  await supabaseClient
    .from('automation_jobs')
    .insert([mockAutomationJobs.freeOrgJob, mockAutomationJobs.proOrgJob])
  
  return true
}

/**
 * Cleanup test data after tests
 */
export const cleanupTestData = async (supabaseClient) => {
  await supabaseClient.from('automation_jobs').delete().neq('id', 'non-existent')
  await supabaseClient.from('audit_reports').delete().neq('id', 'non-existent')
  await supabaseClient.from('generated_automations').delete().neq('id', 'non-existent')
  
  return true
}