/**
 * Brand Fixtures Index - Export all brand packages for testing
 * ProcessAudit AI - Organization Branding System
 */

// Import all brand packages
import { techStartupBrandPackage } from './tech-startup'
import { manufacturingBrandPackage } from './manufacturing'
import { healthcareBrandPackage } from './healthcare'
import { creativeAgencyBrandPackage } from './creative-agency'
import { financeBrandPackage } from './finance'
import { retailBrandPackage } from './retail'
import { hospoDojoBrandPackage } from './hospo-dojo'

// Export individual brand packages
export { hospoDojoBrandPackage } from './hospo-dojo'
export { techStartupBrandPackage } from './tech-startup'
export { manufacturingBrandPackage } from './manufacturing'
export { healthcareBrandPackage } from './healthcare'
export { creativeAgencyBrandPackage } from './creative-agency'
export { financeBrandPackage } from './finance'
export { retailBrandPackage } from './retail'

/**
 * All available brand packages for testing
 */
export const allBrandPackages = {
  'tech-startup': techStartupBrandPackage,
  'manufacturing': manufacturingBrandPackage,
  'healthcare': healthcareBrandPackage,
  'creative-agency': creativeAgencyBrandPackage,
  'finance': financeBrandPackage,
  'retail': retailBrandPackage,
  'hospo-dojo': hospoDojoBrandPackage
} as const

/**
 * Brand package keys for iteration
 */
export const brandKeys = Object.keys(allBrandPackages) as Array<keyof typeof allBrandPackages>

/**
 * Get random brand package for testing
 */
export const getRandomBrandPackage = () => {
  const keys = brandKeys
  const randomKey = keys[Math.floor(Math.random() * keys.length)]
  return allBrandPackages[randomKey]
}

/**
 * Get brand package by industry
 */
export const getBrandPackageByIndustry = (industry: string) => {
  const brandMap = {
    technology: 'tech-startup',
    manufacturing: 'manufacturing',
    healthcare: 'healthcare', 
    creative: 'creative-agency',
    finance: 'finance',
    retail: 'retail'
  }
  
  const key = brandMap[industry as keyof typeof brandMap]
  return key ? allBrandPackages[key] : allBrandPackages['tech-startup']
}

/**
 * Brand testing utilities
 */
export const brandTestUtils = {
  /**
   * Apply brand for testing (CSS variables)
   */
  applyTestBrand: (brandPackage: typeof techStartupBrandPackage) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const { colors } = brandPackage.branding
      
      root.style.setProperty('--color-primary', colors.primary)
      root.style.setProperty('--color-secondary', colors.secondary)
      root.style.setProperty('--color-accent', colors.accent)
      root.style.setProperty('--color-background', colors.background)
      root.style.setProperty('--color-text-primary', colors.text.primary)
    }
  },

  /**
   * Reset to default theme
   */
  resetToDefault: () => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.style.removeProperty('--color-primary')
      root.style.removeProperty('--color-secondary')
      root.style.removeProperty('--color-accent')
    }
  },

  /**
   * Validate brand package structure
   */
  validateBrandPackage: (brandPackage: any): boolean => {
    return !!(
      brandPackage?.branding?.name &&
      brandPackage?.branding?.colors?.primary &&
      brandPackage?.content?.hero?.headline
    )
  }
}

/**
 * Demo organization data for testing
 */
export const demoBrandOrganizations = brandKeys.map(key => ({
  id: `demo_${key}`,
  slug: allBrandPackages[key].branding.slug,
  name: allBrandPackages[key].branding.name,
  branding: allBrandPackages[key].branding,
  content: allBrandPackages[key].content,
  plan: key === 'tech-startup' ? 'enterprise' : 
        key === 'finance' ? 'professional' : 
        'free',
  industry: allBrandPackages[key].metadata.industry
}))