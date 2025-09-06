import { OrganizationBranding } from '../../../types/branding'
import { LandingPageContent } from '../../../types/landing-page'

/**
 * Manufacturing Brand - Industrial/Traditional Company
 * Colors: Steel Blue + Orange with industrial feel
 * Style: Strong, reliable, professional
 */
export const manufacturingBrand: OrganizationBranding = {
  name: 'SteelWorks Industries',
  slug: 'steelworks',
  colors: {
    primary: '#1e3a8a',      // Navy Blue - Trust, stability
    secondary: '#ea580c',    // Orange - Energy, productivity
    accent: '#dc2626',       // Red - Urgency, action
    background: '#f8fafc',   // Light gray
    text: {
      primary: '#1f2937',    // Dark gray
      secondary: '#4b5563',  // Medium gray
      accent: '#dc2626'      // Red accent
    }
  },
  assets: {
    logo: {
      light: '/demo-brands/manufacturing/logo-light.svg',
      dark: '/demo-brands/manufacturing/logo-dark.svg'
    },
    favicon: '/demo-brands/manufacturing/favicon.ico',
    heroBackground: '/demo-brands/manufacturing/industrial-hero.jpg',
    socialMediaIcons: {
      linkedin: '/demo-brands/manufacturing/linkedin-icon.svg',
      youtube: '/demo-brands/manufacturing/youtube-icon.svg'
    }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    headingFont: 'Roboto Slab, serif',
    baseFontSize: 16,
    lineHeight: 1.5
  },
  customDomain: 'steelworks-industries.com',
  customCSS: `
    :root {
      --gradient-primary: linear-gradient(135deg, #1e3a8a 0%, #ea580c 100%);
      --gradient-hero: linear-gradient(rgba(30, 58, 138, 0.8), rgba(234, 88, 12, 0.8));
      --shadow-industrial: 0 6px 24px rgba(30, 58, 138, 0.2);
    }
    
    .industrial-hero {
      background-image: var(--gradient-hero), url('/demo-brands/manufacturing/industrial-bg.jpg');
      background-size: cover;
      background-position: center;
    }
    
    .btn-industrial {
      background: var(--gradient-primary);
      border: 2px solid #ea580c;
      font-weight: 600;
      box-shadow: var(--shadow-industrial);
    }
  `
}

/**
 * Manufacturing Landing Page Content
 */
export const manufacturingContent: LandingPageContent = {
  hero: {
    id: 'hero',
    title: 'SteelWorks Industries',
    headline: 'Optimize Manufacturing Operations with Smart Automation',
    subheadline: 'Reduce waste, increase efficiency, and boost productivity with AI-powered process optimization',
    ctaText: 'Get Process Audit',
    ctaLink: '/sign-up',
    backgroundImage: '/demo-brands/manufacturing/industrial-hero.jpg'
  },
  features: {
    id: 'features',
    title: 'Manufacturing Excellence Features', 
    features: [
      {
        icon: '/demo-brands/manufacturing/icons/production-line.svg',
        title: 'Production Line Analysis',
        description: 'Identify bottlenecks and optimize manufacturing workflows for maximum throughput'
      },
      {
        icon: '/demo-brands/manufacturing/icons/quality-control.svg',
        title: 'Quality Control Automation',
        description: 'Automate quality checks and ensure consistent product standards'
      },
      {
        icon: '/demo-brands/manufacturing/icons/supply-chain.svg',
        title: 'Supply Chain Optimization',
        description: 'Streamline inventory management and supplier relationships'
      }
    ]
  },
  testimonials: {
    id: 'testimonials',
    title: 'Trusted by Industry Leaders',
    testimonials: [
      {
        quote: 'SteelWorks reduced our production downtime by 40% in just 3 months.',
        author: {
          name: 'Robert Thompson',
          title: 'Plant Manager, MegaManufacturing Corp',
          avatar: '/demo-brands/manufacturing/avatars/robert-thompson.jpg'
        }
      },
      {
        quote: 'The ROI analysis helped us prioritize which processes to automate first.',
        author: {
          name: 'Linda Zhang',
          title: 'Operations Director, Precision Parts Ltd',
          avatar: '/demo-brands/manufacturing/avatars/linda-zhang.jpg'
        }
      }
    ]
  },
  cta: {
    id: 'cta', 
    title: 'Optimize Your Manufacturing Operations',
    ctaText: 'Schedule Plant Assessment',
    ctaLink: '/sign-up',
    secondaryCtaText: 'View Case Studies',
    secondaryCtaLink: '/case-studies'
  }
}

/**
 * Complete manufacturing brand package
 */
export const manufacturingBrandPackage = {
  branding: manufacturingBrand,
  content: manufacturingContent,
  metadata: {
    industry: 'manufacturing',
    targetMarket: 'B2B Industrial',
    brandPersonality: ['reliable', 'efficient', 'results-driven', 'professional'],
    colorPsychology: {
      primary: 'Stability, trust, industrial strength',
      secondary: 'Energy, productivity, action-oriented',
      accent: 'Urgency, important alerts, safety'
    }
  }
}