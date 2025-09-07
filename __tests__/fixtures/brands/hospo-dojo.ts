import { 
  OrganizationBranding, 
  LandingPageContent, 
  AccessibilityColorPair 
} from '@/types/client-branding';

const hospoDojoBrandingFixture: OrganizationBranding = {
  name: "Hospo Dojo",
  slug: "hospo-dojo",
  tagline: "Prep For Success",
  
  colors: {
    primary: "#42551C",        // Khaki Green
    secondary: "#1C1C1C",      // Black
    accent: "#42551C",         // Khaki Green
    background: "#FFFFFF",     // White
    surface: "#EAE8DD",        // Ivory
    text: {
      primary: "#1C1C1C",      // Black
      secondary: "#42551C",    // Khaki Green
      accent: "#42551C"        // Khaki Green
    }
  },
  
  typography: {
    fontFamily: '"DM Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    headingFont: '"Gefika", "Bebas Neue", "Oswald", Impact, sans-serif',
    subHeadingFont: '"Nimbus Sans", "Nimbus Sans L", "Helvetica Neue", Arial, sans-serif',
    baseFontSize: 16,
    lineHeight: 1.5,
    headingLineHeight: 1.0
  }
};

const hospoDojoBrandColorPairs: AccessibilityColorPair[] = [
  {
    foreground: "#1C1C1C",  // Black
    background: "#FFFFFF",  // White
    contrastRatio: 17.04,   // AAA
    description: "Black on White"
  },
  {
    foreground: "#1C1C1C",  // Black
    background: "#EAE8DD",  // Ivory
    contrastRatio: 13.87,   // AAA
    description: "Black on Ivory"
  },
  {
    foreground: "#42551C",  // Khaki Green
    background: "#FFFFFF",  // White
    contrastRatio: 8.24,    // AAA
    description: "Khaki on White"
  },
  {
    foreground: "#42551C",  // Khaki Green
    background: "#EAE8DD",  // Ivory
    contrastRatio: 6.71,    // AA (for headings/buttons)
    description: "Khaki on Ivory"
  }
];

const hospoDojoBrandLandingContent: LandingPageContent = {
  hero: {
    headline: "PREP FOR SUCCESS",
    subheadline: "BE BATTLE-READY WITH ACTIONABLE FRAMEWORKS AND MENTORS",
    description: "A safe, collaborative dojo where hospitality pros level up.",
  },
  features: [
    {
      title: "Master Service Standards",
      description: "Framework-driven training for consistent guest experiences"
    },
    {
      title: "Mentor Network Access", 
      description: "Connect with seasoned hospitality senseis and industry masters"
    },
    {
      title: "Battle-Tested Workflows",
      description: "Proven operational frameworks for hospitality excellence"
    }
  ],
  cta: {
    primary: "Join the Dojo",
    secondary: "Start Training"
  }
};

export const hospoDojoBrandPackage = {
  branding: hospoDojoBrandingFixture,
  content: hospoDojoBrandLandingContent,
  metadata: {
    industry: 'hospitality',
    targetMarket: 'Hospitality Professionals',
    brandPersonality: ['Energetic', 'Professional', 'Supportive']
  }
};