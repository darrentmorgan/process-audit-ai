/**
 * TypeScript types and interfaces for multi-tenant organization system
 * ProcessAudit AI - Phase 2 Multi-Tenancy Implementation
 */

import { BrandColors, BrandAssets, BrandTypography } from './branding'
import { LandingPageContent } from './landing-page'

export enum OrganizationTier {
  Free = 'free',
  Pro = 'pro',
  Enterprise = 'enterprise'
}

export interface OrganizationDomainConfig {
  primaryDomain: string
  additionalDomains?: string[]
  ssoEnabled?: boolean
  certificateDetails?: {
    issuer: string
    expirationDate: Date
  }
}

export interface OrganizationSettings {
  general: {
    name: string
    description?: string
    imageUrl?: string
    website?: string
    industry?: string
    tier: OrganizationTier
  }
  branding: {
    colors: BrandColors
    assets: BrandAssets
    typography: BrandTypography
    customDomain?: string
    landingPage?: LandingPageContent
  }
  features: {
    enableAutomations: boolean
    enableReporting: boolean
    enableIntegrations: boolean
    enableAnalytics: boolean
    maxProjects?: number
    maxMembers?: number
  }
  security: {
    requireTwoFactor: boolean
    allowGuestAccess: boolean
    sessionTimeout?: number
    ipWhitelist?: string[]
    domainConfiguration?: OrganizationDomainConfig
  }
  notifications: {
    emailNotifications: boolean
    slackWebhook?: string
    webhookUrl?: string
  }
}

// Advanced validation with more granular checks
export const isValidOrganizationSettings = (settings: any): settings is OrganizationSettings => {
  if (!settings) return false;

  const hasValidGeneral = (
    settings.general?.name != null && 
    settings.general.tier != null && 
    Object.values(OrganizationTier).includes(settings.general.tier)
  );
  
  const hasValidBranding = (
    settings.branding?.colors != null &&
    settings.branding.assets != null &&
    settings.branding.typography != null
  );
  
  const hasValidFeatures = (
    settings.features != null && 
    typeof settings.features.enableAutomations === 'boolean'
  );
  
  const hasValidSecurity = (
    settings.security != null && 
    typeof settings.security.requireTwoFactor === 'boolean'
  );
  
  const hasValidNotifications = (
    settings.notifications != null
  );

  const hasValidDomainConfig = (
    !settings.security?.domainConfiguration || (
      settings.security.domainConfiguration &&
      typeof settings.security.domainConfiguration === 'object' &&
      settings.security.domainConfiguration.primaryDomain != null
    )
  );

  // Debug logging
  console.log('Validation Details:', {
    hasValidGeneral,
    hasValidBranding,
    hasValidFeatures,
    hasValidSecurity,
    hasValidNotifications,
    hasValidDomainConfig,
    domainConfig: settings.security?.domainConfiguration
  });

  return (
    hasValidGeneral && 
    hasValidBranding && 
    hasValidFeatures && 
    hasValidSecurity && 
    hasValidNotifications && 
    hasValidDomainConfig
  );
}

export const sanitizeOrganizationSettings = (settings: Partial<OrganizationSettings>): OrganizationSettings => {
  return {
    general: {
      name: settings.general?.name || 'Unnamed Organization',
      tier: settings.general?.tier || OrganizationTier.Free,
      description: settings.general?.description || '',
      imageUrl: settings.general?.imageUrl,
      website: settings.general?.website,
      industry: settings.general?.industry
    },
    branding: {
      colors: settings.branding?.colors || {
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
      assets: settings.branding?.assets || {},
      typography: settings.branding?.typography || {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        baseFontSize: 16,
        lineHeight: 1.5
      },
      customDomain: settings.branding?.customDomain,
      landingPage: settings.branding?.landingPage
    },
    features: {
      enableAutomations: settings.features?.enableAutomations || false,
      enableReporting: settings.features?.enableReporting || false,
      enableIntegrations: settings.features?.enableIntegrations || false,
      enableAnalytics: settings.features?.enableAnalytics || false,
      maxProjects: settings.features?.maxProjects || 5,
      maxMembers: settings.features?.maxMembers || 10
    },
    security: {
      requireTwoFactor: settings.security?.requireTwoFactor || false,
      allowGuestAccess: settings.security?.allowGuestAccess || false,
      sessionTimeout: settings.security?.sessionTimeout || 3600, // 1 hour default
      ipWhitelist: settings.security?.ipWhitelist || [],
      domainConfiguration: settings.security?.domainConfiguration
    },
    notifications: {
      emailNotifications: settings.notifications?.emailNotifications || true,
      slackWebhook: settings.notifications?.slackWebhook,
      webhookUrl: settings.notifications?.webhookUrl
    }
  };
}