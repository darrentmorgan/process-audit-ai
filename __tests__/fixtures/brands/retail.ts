import { OrganizationBranding } from '../../../types/branding'
import { LandingPageContent } from '../../../types/landing-page'

/**
 * Retail Brand - Consumer-Friendly E-commerce
 * Colors: Emerald + Orange with friendly, approachable feel
 * Style: Friendly, approachable, energetic, consumer-focused
 */
export const retailBrand: OrganizationBranding = {
  name: 'ShopSmart Solutions',
  slug: 'shopsmart',
  colors: {
    primary: '#10b981',      // Emerald - Growth, fresh, positive
    secondary: '#f97316',    // Orange - Energy, friendly, action
    accent: '#3b82f6',       // Blue - Trust, reliability
    background: '#ffffff',   // Clean white
    text: {
      primary: '#111827',    // Near black
      secondary: '#6b7280',  // Gray
      accent: '#f97316'      // Orange accent
    }
  },
  assets: {
    logo: {
      light: '/demo-brands/retail/logo-light.svg',
      dark: '/demo-brands/retail/logo-dark.svg'
    },
    favicon: '/demo-brands/retail/favicon.ico',
    heroBackground: '/demo-brands/retail/shopping-hero.jpg',
    socialMediaIcons: {
      facebook: '/demo-brands/retail/facebook-icon.svg',
      instagram: '/demo-brands/retail/instagram-icon.svg',
      twitter: '/demo-brands/retail/twitter-icon.svg'
    }
  },
  typography: {
    fontFamily: 'Nunito, system-ui, sans-serif',
    headingFont: 'Nunito, sans-serif',
    baseFontSize: 16,
    lineHeight: 1.6
  },
  customDomain: 'shopsmart.solutions',
  customCSS: `
    :root {
      --gradient-primary: linear-gradient(135deg, #10b981 0%, #f97316 100%);
      --gradient-cta: linear-gradient(135deg, #f97316 0%, #10b981 100%);
      --shadow-retail: 0 4px 20px rgba(16, 185, 129, 0.2);
      --border-friendly: 2px solid #10b981;
    }
    
    .retail-hero {
      background: var(--gradient-primary);
    }
    
    .btn-retail {
      background: var(--gradient-cta);
      border-radius: 12px;
      box-shadow: var(--shadow-retail);
    }
    
    .card-retail {
      border: var(--border-friendly);
      border-radius: 16px;
    }
  `
}

export const retailContent: LandingPageContent = {
  hero: {
    id: 'hero',
    title: 'ShopSmart Solutions',
    headline: 'Boost Your E-commerce Operations 🛒',
    subheadline: 'Automate inventory, orders, and customer service to scale your retail business effortlessly',
    ctaText: 'Optimize My Store',
    ctaLink: '/sign-up'
  },
  features: {
    id: 'features',
    title: 'Retail Automation Features',
    features: [
      {
        icon: '/demo-brands/retail/icons/inventory.svg',
        title: 'Smart Inventory Management',
        description: 'Automate stock levels, reordering, and supplier communications'
      },
      {
        icon: '/demo-brands/retail/icons/customer-service.svg',
        title: 'Customer Service Automation',
        description: 'Handle inquiries, returns, and support tickets automatically'
      },
      {
        icon: '/demo-brands/retail/icons/sales-analytics.svg',
        title: 'Sales Analytics',
        description: 'Track performance and optimize sales processes with AI insights'
      }
    ]
  },
  cta: {
    id: 'cta',
    title: 'Scale Your Retail Business Today! 📈',
    ctaText: 'Start Free Trial',
    ctaLink: '/sign-up',
    secondaryCtaText: 'See Pricing',
    secondaryCtaLink: '/pricing'
  }
}

export const retailBrandPackage = {
  branding: retailBrand,
  content: retailContent,
  metadata: {
    industry: 'retail',
    targetMarket: 'B2C/B2B Retail',
    brandPersonality: ['friendly', 'energetic', 'helpful', 'growth-oriented'],
    colorPsychology: {
      primary: 'Growth, freshness, positive action',
      secondary: 'Energy, enthusiasm, conversion',
      accent: 'Trust, reliability, call-to-action'
    }
  }
}