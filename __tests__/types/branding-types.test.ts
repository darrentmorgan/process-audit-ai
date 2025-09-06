import { 
  BrandColors, 
  BrandAssets, 
  BrandTypography, 
  OrganizationBranding, 
  ThemeMode 
} from '../../types/branding'

import { 
  LandingPageContent 
} from '../../types/landing-page'

describe('Organization Branding Types', () => {
  const validBrandColors: BrandColors = {
    primary: '#007bff',
    secondary: '#6c757d',
    accent: '#28a745',
    background: '#ffffff',
    text: {
      primary: '#212529',
      secondary: '#6c757d',
      accent: '#28a745'
    }
  } as const

  const validBrandAssets: BrandAssets = {
    logo: {
      light: '/logos/light-logo.svg',
      dark: '/logos/dark-logo.svg'
    },
    favicon: '/favicon.ico',
    heroBackground: '/hero-bg.jpg',
    socialMediaIcons: {
      twitter: '/icons/twitter.svg',
      linkedin: '/icons/linkedin.svg'
    }
  } as const

  const validBrandTypography: BrandTypography = {
    fontFamily: 'Inter, sans-serif',
    headingFont: 'Poppins, sans-serif',
    baseFontSize: 16,
    lineHeight: 1.5
  } as const

  const validLandingPageContent: LandingPageContent = {
    hero: {
      id: 'hero',
      title: 'Welcome to ProcessAudit AI',
      headline: 'Transform Your Business Processes',
      subheadline: 'Automate, Analyze, and Optimize',
      ctaText: 'Get Started',
      ctaLink: '/sign-up'
    },
    features: {
      id: 'features',
      title: 'Key Features',
      features: [
        {
          icon: '/icons/analyze.svg',
          title: 'Process Analysis',
          description: 'Deep insights into your business workflows'
        }
      ]
    },
    cta: {
      id: 'cta',
      title: 'Ready to Transform Your Business?',
      ctaText: 'Start Free Trial',
      ctaLink: '/sign-up'
    }
  } as const

  const validOrganizationBranding: OrganizationBranding = {
    name: 'ProcessAudit Enterprise',
    slug: 'process-audit-enterprise',
    colors: validBrandColors,
    assets: validBrandAssets,
    typography: validBrandTypography,
    customDomain: 'enterprise.processaudit.ai',
    customCSS: '.custom-brand { color: #007bff; }'
  } as const

  test('validates BrandColors type', () => {
    expect(validBrandColors).toEqual(expect.objectContaining({
      primary: expect.any(String),
      secondary: expect.any(String),
      text: expect.objectContaining({
        primary: expect.any(String)
      })
    }))
  })

  test('validates BrandAssets type', () => {
    expect(validBrandAssets).toEqual(expect.objectContaining({
      logo: expect.objectContaining({
        light: expect.any(String),
        dark: expect.any(String)
      }),
      socialMediaIcons: expect.any(Object)
    }))
  })

  test('validates OrganizationBranding type', () => {
    expect(validOrganizationBranding).toEqual(expect.objectContaining({
      name: expect.any(String),
      slug: expect.any(String),
      colors: expect.any(Object),
      assets: expect.any(Object)
    }))
  })

  test('validates LandingPageContent', () => {
    expect(validLandingPageContent).toEqual(expect.objectContaining({
      hero: expect.objectContaining({
        headline: expect.any(String),
        ctaText: expect.any(String)
      }),
      cta: expect.objectContaining({
        ctaText: expect.any(String)
      })
    }))
  })
})