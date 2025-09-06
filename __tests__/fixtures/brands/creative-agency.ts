import { OrganizationBranding } from '../../../types/branding'
import { LandingPageContent } from '../../../types/landing-page'

/**
 * Creative Agency Brand - Bold, Artistic Design Studio
 * Colors: Purple + Pink with vibrant gradients
 * Style: Creative, bold, innovative, artistic
 */
export const creativeAgencyBrand: OrganizationBranding = {
  name: 'Pixel & Process',
  slug: 'pixel-process',
  colors: {
    primary: '#8b5cf6',      // Purple - Creativity, premium
    secondary: '#ec4899',    // Pink - Energy, creativity
    accent: '#f59e0b',       // Amber - Attention, highlights
    background: '#fefefe',   // Off-white
    text: {
      primary: '#1f2937',    // Dark
      secondary: '#6b7280',  // Gray
      accent: '#8b5cf6'      // Purple accent
    }
  },
  assets: {
    logo: {
      light: '/demo-brands/creative-agency/logo-light.svg',
      dark: '/demo-brands/creative-agency/logo-dark.svg'
    },
    favicon: '/demo-brands/creative-agency/favicon.ico',
    heroBackground: '/demo-brands/creative-agency/creative-hero.jpg',
    socialMediaIcons: {
      instagram: '/demo-brands/creative-agency/instagram-icon.svg',
      dribbble: '/demo-brands/creative-agency/dribbble-icon.svg',
      behance: '/demo-brands/creative-agency/behance-icon.svg',
      twitter: '/demo-brands/creative-agency/twitter-icon.svg'
    }
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFont: 'Cal Sans, Inter, sans-serif',
    baseFontSize: 16,
    lineHeight: 1.6
  },
  customDomain: 'pixelprocess.studio',
  customCSS: `
    :root {
      --gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
      --gradient-secondary: linear-gradient(45deg, #ec4899 0%, #f59e0b 100%);
      --gradient-text: linear-gradient(135deg, #8b5cf6, #ec4899);
      --shadow-creative: 0 8px 32px rgba(139, 92, 246, 0.2);
      --glow-effect: 0 0 20px rgba(236, 72, 153, 0.3);
    }
    
    .creative-hero {
      background: var(--gradient-primary);
    }
    
    .gradient-text {
      background: var(--gradient-text);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .btn-creative {
      background: var(--gradient-secondary);
      box-shadow: var(--shadow-creative);
      border-radius: 16px;
      transition: all 0.3s ease;
    }
    
    .btn-creative:hover {
      box-shadow: var(--glow-effect);
      transform: translateY(-2px);
    }
  `
}

/**
 * Creative Agency Landing Page Content
 */
export const creativeAgencyContent: LandingPageContent = {
  hero: {
    id: 'hero',
    title: 'Pixel & Process',
    headline: 'Where Creativity Meets Efficiency ✨',
    subheadline: 'Automate your creative workflows so you can focus on what matters most - creating amazing work',
    ctaText: 'Optimize My Creative Process',
    ctaLink: '/sign-up',
    backgroundImage: '/demo-brands/creative-agency/creative-hero.jpg'
  },
  features: {
    id: 'features',
    title: 'Creative Workflow Solutions',
    features: [
      {
        icon: '/demo-brands/creative-agency/icons/design-system.svg',
        title: 'Design System Automation',
        description: 'Streamline design handoffs and maintain brand consistency across all projects'
      },
      {
        icon: '/demo-brands/creative-agency/icons/client-approval.svg',
        title: 'Client Approval Workflows',
        description: 'Automate review cycles and feedback collection for faster project completion'
      },
      {
        icon: '/demo-brands/creative-agency/icons/asset-management.svg',
        title: 'Creative Asset Management', 
        description: 'Organize and optimize your creative assets with intelligent tagging and search'
      }
    ]
  },
  testimonials: {
    id: 'testimonials',
    title: 'Loved by Creative Teams',
    testimonials: [
      {
        quote: 'We cut our project delivery time in half while maintaining our creative standards.',
        author: {
          name: 'Maya Patel',
          title: 'Creative Director, Visionary Studios',
          avatar: '/demo-brands/creative-agency/avatars/maya-patel.jpg'
        }
      },
      {
        quote: 'Finally, a system that understands creative workflows. Game-changer!',
        author: {
          name: 'Alex Rivera',
          title: 'Founder, Color & Code Agency',
          avatar: '/demo-brands/creative-agency/avatars/alex-rivera.jpg'
        }
      }
    ]
  },
  cta: {
    id: 'cta',
    title: 'Ready to Supercharge Your Creative Process? 🚀',
    ctaText: 'Start Creating Smarter',
    ctaLink: '/sign-up',
    secondaryCtaText: 'See Our Portfolio',
    secondaryCtaLink: '/portfolio'
  }
}

/**
 * Complete creative agency brand package
 */
export const creativeAgencyBrandPackage = {
  branding: creativeAgencyBrand,
  content: creativeAgencyContent,
  metadata: {
    industry: 'creative',
    targetMarket: 'B2B Creative Services',
    brandPersonality: ['innovative', 'artistic', 'bold', 'inspiring'],
    colorPsychology: {
      primary: 'Creativity, luxury, imagination',
      secondary: 'Energy, passion, boldness',
      accent: 'Attention, highlights, call-to-action'
    }
  }
}