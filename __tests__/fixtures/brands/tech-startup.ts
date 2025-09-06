import { OrganizationBranding } from '../../../types/branding'
import { LandingPageContent } from '../../../types/landing-page'

/**
 * Tech Startup Brand - Modern SaaS Company
 * Colors: Indigo + Cyan with modern gradients
 * Style: Clean, modern, tech-forward
 */
export const techStartupBrand: OrganizationBranding = {
  name: 'TechFlow AI',
  slug: 'techflow',
  colors: {
    primary: '#6366f1',      // Indigo - Modern, trustworthy
    secondary: '#06b6d4',    // Cyan - Innovation, tech
    accent: '#f59e0b',       // Amber - Energy, action
    background: '#ffffff',   // Clean white
    text: {
      primary: '#111827',    // Near black
      secondary: '#6b7280',  // Gray-500
      accent: '#f59e0b'      // Amber accent
    }
  },
  assets: {
    logo: {
      light: '/demo-brands/tech-startup/logo-light.svg',
      dark: '/demo-brands/tech-startup/logo-dark.svg'
    },
    favicon: '/demo-brands/tech-startup/favicon.ico',
    heroBackground: '/demo-brands/tech-startup/hero-gradient.jpg',
    socialMediaIcons: {
      twitter: '/demo-brands/tech-startup/twitter-icon.svg',
      linkedin: '/demo-brands/tech-startup/linkedin-icon.svg',
      github: '/demo-brands/tech-startup/github-icon.svg'
    }
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFont: 'Space Grotesk, Inter, sans-serif',
    baseFontSize: 16,
    lineHeight: 1.6
  },
  customDomain: 'techflow.ai',
  customCSS: `
    :root {
      --gradient-primary: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
      --gradient-secondary: linear-gradient(135deg, #06b6d4 0%, #f59e0b 100%);
      --shadow-brand: 0 4px 20px rgba(99, 102, 241, 0.15);
    }
    
    .hero-gradient {
      background: var(--gradient-primary);
    }
    
    .cta-button {
      background: var(--gradient-secondary);
      box-shadow: var(--shadow-brand);
    }
  `
}

/**
 * Tech Startup Landing Page Content
 */
export const techStartupContent: LandingPageContent = {
  hero: {
    id: 'hero',
    title: 'TechFlow AI',
    headline: 'Automate Your Workflow with Intelligent AI',
    subheadline: 'Transform manual processes into smart automations that scale with your business',
    ctaText: 'Start Free Trial',
    ctaLink: '/sign-up',
    backgroundImage: '/demo-brands/tech-startup/hero-gradient.jpg'
  },
  features: {
    id: 'features', 
    title: 'Powerful AI-Driven Features',
    features: [
      {
        icon: '/demo-brands/tech-startup/icons/ai-brain.svg',
        title: 'Smart Process Analysis',
        description: 'AI analyzes your workflows and identifies optimization opportunities in minutes'
      },
      {
        icon: '/demo-brands/tech-startup/icons/automation.svg', 
        title: 'One-Click Automation',
        description: 'Generate production-ready automation workflows with a single click'
      },
      {
        icon: '/demo-brands/tech-startup/icons/analytics.svg',
        title: 'Real-Time Analytics',
        description: 'Track performance metrics and ROI in real-time dashboards'
      }
    ]
  },
  testimonials: {
    id: 'testimonials',
    title: 'Trusted by Leading Startups',
    testimonials: [
      {
        quote: 'TechFlow AI automated 80% of our manual processes. We\'re scaling faster than ever.',
        author: {
          name: 'Sarah Chen',
          title: 'CTO, ScaleUp Ventures',
          avatar: '/demo-brands/tech-startup/avatars/sarah-chen.jpg'
        }
      },
      {
        quote: 'The AI insights helped us identify bottlenecks we didn\'t even know existed.',
        author: {
          name: 'Marcus Rodriguez',
          title: 'Head of Operations, InnovateCorp',
          avatar: '/demo-brands/tech-startup/avatars/marcus-rodriguez.jpg'
        }
      }
    ]
  },
  cta: {
    id: 'cta',
    title: 'Ready to Scale Your Operations?',
    ctaText: 'Start Your Free Trial',
    ctaLink: '/sign-up',
    secondaryCtaText: 'Book a Demo',
    secondaryCtaLink: '/demo'
  }
}

/**
 * Complete tech startup brand package
 */
export const techStartupBrandPackage = {
  branding: techStartupBrand,
  content: techStartupContent,
  metadata: {
    industry: 'technology',
    targetMarket: 'B2B SaaS',
    brandPersonality: ['innovative', 'trustworthy', 'modern', 'efficient'],
    colorPsychology: {
      primary: 'Trust, reliability, innovation',
      secondary: 'Growth, energy, forward-thinking', 
      accent: 'Action, urgency, conversion'
    }
  }
}