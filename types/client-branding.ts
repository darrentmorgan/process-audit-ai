// Client Branding Type Definitions

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface TypographyConfig {
  fontFamily: string;
  headingFont: string;
  subHeadingFont: string;
  baseFontSize: number;
  lineHeight: number;
  headingLineHeight: number;
}

export interface AccessibilityColorPair {
  foreground: string;
  background: string;
  contrastRatio: number;
  description: string;
}

export interface FeatureContent {
  title: string;
  description: string;
}

export interface CTAContent {
  primary: string;
  secondary: string;
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  description: string;
}

export interface LandingPageContent {
  hero: HeroContent;
  features: FeatureContent[];
  cta: CTAContent;
}

export interface OrganizationBranding {
  name: string;
  slug: string;
  tagline: string;
  colors: ColorPalette;
  typography: TypographyConfig;
}

export interface ClientBrandExtensions {
  designElements?: {
    waves?: boolean;
    scribbles?: boolean;
    textures?: string[];
  };
  industrySpecificContent?: {
    domain: string;
    keywords: string[];
    messagingTone: 'professional' | 'casual' | 'technical';
  };
}

// Utility type for theme injection
export type ThemeInjectionConfig = OrganizationBranding & ClientBrandExtensions;