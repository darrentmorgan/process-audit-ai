// Client Branding Types for ProcessAudit AI

import { Organization } from './organization'

export interface ClientBrandingColors {
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  textColor?: string
  backgroundColor?: string
}

export interface ClientBrandingAssets {
  logoUrl?: string
  faviconUrl?: string
  heroImageUrl?: string
  bannerImageUrl?: string
}

export interface ClientBrandingTypography {
  fontFamily?: string
  headingFont?: string
  bodyFont?: string
}

export interface ClientBrandingTheme {
  mode?: 'light' | 'dark'
  borderRadius?: number
  boxShadow?: string
}

export interface ClientBrandPackage {
  // Unique identifier for the client brand
  clientId: string

  // Client organization details
  organization: Pick<Organization, 'id' | 'name' | 'slug'>

  // Branding components
  colors: ClientBrandingColors
  assets: ClientBrandingAssets
  typography: ClientBrandingTypography
  theme: ClientBrandingTheme

  // Deployment configuration
  deployment: {
    routingType: 'domain' | 'subdomain' | 'path'
    primaryDomain?: string
    alternativeDomains?: string[]
    sslRequired: boolean
  }

  // Content customization
  customContent?: {
    landingPageTitle?: string
    landingPageSubtitle?: string
    ctaText?: string
  }

  // Permissions and access levels
  brandingLevel: 'basic' | 'full' | 'white-label'
  
  // Timestamps for tracking
  createdAt: Date
  updatedAt: Date
}

// Configuration for brand management UI
export interface ClientBrandEditorConfig {
  allowedFileTypes: string[]
  maxLogoSize: number // in bytes
  colorValidation: {
    minContrast: number
    allowCustom: boolean
  }
}

// Validation result for brand configuration
export interface BrandValidationResult {
  isValid: boolean
  errors?: {
    field: keyof ClientBrandPackage
    message: string
  }[]
}