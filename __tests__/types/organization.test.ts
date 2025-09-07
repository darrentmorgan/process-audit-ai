import { 
  OrganizationSettings, 
  isValidOrganizationSettings, 
  sanitizeOrganizationSettings,
  OrganizationTier
} from '../../types/organization'

describe('Organization Settings Types', () => {
  const mockValidSettings: OrganizationSettings = {
    general: {
      name: 'Acme Corp',
      tier: OrganizationTier.Pro,
      description: 'Enterprise workflow automation',
      industry: 'Technology'
    },
    branding: {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        accent: '#28a745',
        background: '#ffffff',
        text: {
          primary: '#212529',
          secondary: '#495057',
          accent: '#28a745'
        }
      },
      assets: {
        logo: {
          light: '/logos/acme-light.svg',
          dark: '/logos/acme-dark.svg'
        }
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        baseFontSize: 16,
        lineHeight: 1.5
      }
    },
    features: {
      enableAutomations: true,
      enableReporting: true,
      enableIntegrations: false,
      enableAnalytics: true,
      maxProjects: 10,
      maxMembers: 25
    },
    security: {
      requireTwoFactor: true,
      allowGuestAccess: false,
      sessionTimeout: 7200,
      ipWhitelist: ['192.168.1.0/24']
    },
    notifications: {
      emailNotifications: true,
      slackWebhook: 'https://hooks.slack.com/example'
    }
  }

  test('isValidOrganizationSettings validates complete settings', () => {
    expect(isValidOrganizationSettings(mockValidSettings)).toBe(true)
  })

  test('isValidOrganizationSettings fails with incomplete settings', () => {
    const incompleteSettings = { ...mockValidSettings }
    delete incompleteSettings.general.name
    expect(isValidOrganizationSettings(incompleteSettings)).toBe(false)
  })

  test('sanitizeOrganizationSettings provides defaults', () => {
    const partialSettings = {
      general: { name: 'Test Org' },
      branding: { 
        colors: { primary: '#ff0000' }
      }
    }
    const sanitized = sanitizeOrganizationSettings(partialSettings)
    
    expect(sanitized.general.name).toBe('Test Org')
    expect(sanitized.general.tier).toBe(OrganizationTier.Free)
    expect(sanitized.branding.colors.primary).toBe('#ff0000')
    expect(sanitized.features.enableAutomations).toBe(false)
  })

  test('supports multi-domain configurations', () => {
    const settingsWithDomain: OrganizationSettings = {
      ...mockValidSettings,
      security: {
        ...mockValidSettings.security,
        domainConfiguration: {
          primaryDomain: 'acme.com',
          additionalDomains: ['acmecorp.com', 'acme.io'],
          ssoEnabled: true,
          certificateDetails: {
            issuer: 'Let\'s Encrypt',
            expirationDate: new Date('2024-12-31')
          }
        }
      }
    }

    const copy = JSON.parse(JSON.stringify(settingsWithDomain))
    expect(isValidOrganizationSettings(copy)).toBe(true)
    expect(copy.security.domainConfiguration.primaryDomain).toBe('acme.com')
  })
})