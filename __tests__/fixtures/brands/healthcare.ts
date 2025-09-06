import { OrganizationBranding } from '../../../types/branding'
import { LandingPageContent } from '../../../types/landing-page'

/**
 * Healthcare Brand - Medical/Professional Organization  
 * Colors: Teal + Navy with clean, trustworthy feel
 * Style: Professional, clean, trustworthy, accessible
 */
export const healthcareBrand: OrganizationBranding = {
  name: 'MedFlow Systems',
  slug: 'medflow',
  colors: {
    primary: '#0891b2',      // Teal - Medical, calm, professional
    secondary: '#1e40af',    // Navy - Trust, reliability  
    accent: '#059669',       // Green - Health, success
    background: '#ffffff',   // Pure white - cleanliness
    text: {
      primary: '#1f2937',    // Dark gray
      secondary: '#6b7280',  // Medium gray
      accent: '#059669'      // Green accent
    }
  },
  assets: {
    logo: {
      light: '/demo-brands/healthcare/logo-light.svg',
      dark: '/demo-brands/healthcare/logo-dark.svg'
    },
    favicon: '/demo-brands/healthcare/favicon.ico',
    heroBackground: '/demo-brands/healthcare/medical-hero.jpg',
    socialMediaIcons: {
      linkedin: '/demo-brands/healthcare/linkedin-icon.svg'
    }
  },
  typography: {
    fontFamily: 'Source Sans Pro, system-ui, sans-serif',
    headingFont: 'Merriweather, serif',
    baseFontSize: 16,
    lineHeight: 1.7
  },
  customDomain: 'medflow.health',
  customCSS: `
    :root {
      --gradient-primary: linear-gradient(135deg, #0891b2 0%, #1e40af 100%);
      --gradient-accent: linear-gradient(135deg, #059669 0%, #0891b2 100%);
      --shadow-medical: 0 2px 12px rgba(8, 145, 178, 0.1);
      --border-medical: 1px solid #e5f3ff;
    }
    
    .medical-hero {
      background: var(--gradient-primary);
    }
    
    .medical-card {
      border: var(--border-medical);
      box-shadow: var(--shadow-medical);
    }
    
    .btn-medical {
      background: var(--gradient-accent);
      border-radius: 8px;
    }
  `
}

/**
 * Healthcare Landing Page Content
 */
export const healthcareContent: LandingPageContent = {
  hero: {
    id: 'hero',
    title: 'MedFlow Systems',
    headline: 'Streamline Healthcare Operations with Intelligent Automation',
    subheadline: 'Improve patient outcomes while reducing administrative burden through smart process optimization',
    ctaText: 'Schedule Demo',
    ctaLink: '/demo',
    backgroundImage: '/demo-brands/healthcare/medical-hero.jpg'
  },
  features: {
    id: 'features',
    title: 'Healthcare-Focused Solutions',
    features: [
      {
        icon: '/demo-brands/healthcare/icons/patient-flow.svg',
        title: 'Patient Flow Optimization',
        description: 'Reduce wait times and improve patient experience through optimized scheduling and routing'
      },
      {
        icon: '/demo-brands/healthcare/icons/compliance.svg',
        title: 'HIPAA Compliance Automation',
        description: 'Automate compliance checks and documentation while maintaining patient privacy'
      },
      {
        icon: '/demo-brands/healthcare/icons/reporting.svg',
        title: 'Clinical Reporting',
        description: 'Generate accurate reports and analytics for better clinical decision-making'
      }
    ]
  },
  testimonials: {
    id: 'testimonials',
    title: 'Trusted by Healthcare Professionals',
    testimonials: [
      {
        quote: 'MedFlow helped us reduce patient wait times by 35% while maintaining quality care.',
        author: {
          name: 'Dr. Michael Anderson',
          title: 'Chief Medical Officer, Regional Health Network',
          avatar: '/demo-brands/healthcare/avatars/dr-anderson.jpg'
        }
      },
      {
        quote: 'The compliance automation saved us hundreds of hours of manual documentation.',
        author: {
          name: 'Jennifer Williams, RN',
          title: 'Director of Quality Assurance, MedCenter Plus',
          avatar: '/demo-brands/healthcare/avatars/jennifer-williams.jpg'
        }
      }
    ]
  },
  cta: {
    id: 'cta',
    title: 'Improve Patient Care Through Better Operations',
    ctaText: 'Schedule Consultation',
    ctaLink: '/consultation',
    secondaryCtaText: 'Download HIPAA Guide',
    secondaryCtaLink: '/resources/hipaa-compliance'
  }
}

/**
 * Complete healthcare brand package
 */
export const healthcareBrandPackage = {
  branding: healthcareBrand,
  content: healthcareContent,
  metadata: {
    industry: 'healthcare',
    targetMarket: 'B2B Healthcare',
    brandPersonality: ['trustworthy', 'professional', 'caring', 'reliable'],
    colorPsychology: {
      primary: 'Medical professionalism, calm, trust',
      secondary: 'Reliability, corporate trust, stability',
      accent: 'Health, positive outcomes, success'
    }
  }
}