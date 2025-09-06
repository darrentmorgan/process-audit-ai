// Branding and Theming Type Definitions for ProcessAudit AI

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: {
    primary: string
    secondary: string
    accent: string
  }
}

export interface BrandAssets {
  logo?: {
    light: string
    dark: string
  }
  favicon?: string
  heroBackground?: string
  socialMediaIcons?: {
    [platform: string]: string
  }
}

export interface BrandTypography {
  fontFamily: string
  headingFont?: string
  baseFontSize: number
  lineHeight: number
}

export interface OrganizationBranding {
  name: string
  slug: string
  colors: BrandColors
  assets: BrandAssets
  typography: BrandTypography
  customDomain?: string
  customCSS?: string
}

export type ThemeMode = 'light' | 'dark'

export interface ThemeContextType {
  theme: OrganizationBranding
  defaultTheme: OrganizationBranding
  isLoading: boolean
  error: string | null
  
  isPreviewMode: boolean
  previewTheme: OrganizationBranding | null
  
  updateTheme: (theme: Partial<OrganizationBranding>) => Promise<void>
  reloadTheme: () => Promise<void>
  resetTheme: () => Promise<void>
  
  startPreview: (theme: Partial<OrganizationBranding>) => void
  endPreview: () => void
  applyPreview: () => Promise<void>
  
  getThemeValue: (path: string) => any
  exportTheme: () => string
  importTheme: (themeJson: string) => Promise<void>
  validateTheme: (theme: any) => string[]
}

export const DEFAULT_THEME: OrganizationBranding = {
  name: 'ProcessAudit AI',
  slug: 'processaudit',
  colors: {
    primary: '#4299e1',
    secondary: '#38a169',
    accent: '#ed8936',
    background: '#ffffff',
    text: {
      primary: '#2d3748',
      secondary: '#4a5568',
      accent: '#ed8936'
    }
  },
  assets: {
    logo: {
      light: '/logos/processaudit-light.svg',
      dark: '/logos/processaudit-dark.svg'
    },
    favicon: '/favicon.ico',
    heroBackground: '/backgrounds/hero-default.jpg'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headingFont: 'Inter, sans-serif',
    baseFontSize: 16,
    lineHeight: 1.5
  },
  customDomain: 'processaudit.ai',
  customCSS: `
    :root {
      --primary-color: #4299e1;
      --secondary-color: #38a169;
      --accent-color: #ed8936;
    }
  `
}