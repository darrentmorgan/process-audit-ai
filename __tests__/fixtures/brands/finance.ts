import { OrganizationBranding } from '../../../types/branding'
import { LandingPageContent } from '../../../types/landing-page'

/**
 * Finance Brand - Professional Financial Services
 * Colors: Navy + Gold with conservative, trustworthy feel
 * Style: Professional, conservative, trustworthy, authoritative
 */
export const financeBrand: OrganizationBranding = {
  name: 'WealthWise Financial',
  slug: 'wealthwise',
  colors: {
    primary: '#1e3a8a',      // Navy - Trust, stability, authority
    secondary: '#d97706',    // Gold - Prosperity, value, premium
    accent: '#059669',       // Green - Growth, money, success
    background: '#ffffff',   // Clean white
    text: {
      primary: '#1f2937',    // Dark professional
      secondary: '#4b5563',  // Professional gray
      accent: '#d97706'      // Gold accent
    }
  },
  assets: {
    logo: {
      light: '/demo-brands/finance/logo-light.svg',
      dark: '/demo-brands/finance/logo-dark.svg'
    },
    favicon: '/demo-brands/finance/favicon.ico',
    heroBackground: '/demo-brands/finance/finance-hero.jpg',
    socialMediaIcons: {
      linkedin: '/demo-brands/finance/linkedin-icon.svg'
    }
  },
  typography: {
    fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
    headingFont: 'IBM Plex Serif, serif',
    baseFontSize: 16,
    lineHeight: 1.5
  },
  customDomain: 'wealthwise.financial',
  customCSS: `
    :root {
      --gradient-primary: linear-gradient(135deg, #1e3a8a 0%, #d97706 100%);
      --gradient-gold: linear-gradient(135deg, #d97706 0%, #fbbf24 100%);
      --shadow-financial: 0 4px 16px rgba(30, 58, 138, 0.15);
      --border-gold: 2px solid #d97706;
    }
    
    .financial-hero {
      background: var(--gradient-primary);
    }
    
    .btn-financial {
      background: var(--gradient-gold);
      border: var(--border-gold);
      box-shadow: var(--shadow-financial);
    }
  `
}

export const financeContent: LandingPageContent = {
  hero: {
    id: 'hero',
    title: 'WealthWise Financial',
    headline: 'Maximize Efficiency in Financial Operations',
    subheadline: 'Automate compliance, reporting, and client management for superior financial outcomes',
    ctaText: 'Get Financial Audit',
    ctaLink: '/sign-up'
  },
  features: {
    id: 'features',
    title: 'Financial Process Excellence',
    features: [
      {
        icon: '/demo-brands/finance/icons/compliance.svg',
        title: 'Regulatory Compliance',
        description: 'Automate compliance checks and regulatory reporting for multiple jurisdictions'
      },
      {
        icon: '/demo-brands/finance/icons/risk-analysis.svg',
        title: 'Risk Assessment Automation',
        description: 'Intelligent risk analysis and automated portfolio monitoring'
      },
      {
        icon: '/demo-brands/finance/icons/client-onboarding.svg',
        title: 'Client Onboarding',
        description: 'Streamline KYC processes and client relationship management'
      }
    ]
  },
  cta: {
    id: 'cta',
    title: 'Optimize Your Financial Operations',
    ctaText: 'Schedule Assessment',
    ctaLink: '/sign-up'
  }
}

export const financeBrandPackage = {
  branding: financeBrand,
  content: financeContent,
  metadata: {
    industry: 'finance',
    targetMarket: 'B2B Financial Services',
    brandPersonality: ['trustworthy', 'authoritative', 'professional', 'reliable'],
    colorPsychology: {
      primary: 'Authority, trust, financial stability',
      secondary: 'Prosperity, value, premium service',
      accent: 'Growth, success, positive returns'
    }
  }
}