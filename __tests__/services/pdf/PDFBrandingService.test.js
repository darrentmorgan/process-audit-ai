/**
 * PDFBrandingService Service Tests
 * 
 * Comprehensive test suite for PDF branding functionality
 * Tests branding application, organization support, and visual identity management
 */

const PDFBrandingService = require('../../../services/pdf/PDFBrandingService')

describe('PDFBrandingService', () => {
  let brandingService

  beforeEach(() => {
    brandingService = new PDFBrandingService()
  })

  afterEach(() => {
    brandingService.clearCache()
  })

  describe('initialization', () => {
    it('should initialize with default branding', () => {
      expect(brandingService).toBeInstanceOf(PDFBrandingService)
      expect(brandingService.defaultBranding).toBeDefined()
      expect(brandingService.defaultBranding.companyName).toBe('ProcessAudit AI')
      expect(brandingService.defaultBranding.primaryColor).toBeDefined()
      expect(brandingService.defaultBranding.fontFamily).toBeDefined()
    })

    it('should initialize with custom branding', () => {
      const customBranding = {
        companyName: 'Custom Corp',
        primaryColor: '#ff0000'
      }
      
      const service = new PDFBrandingService(customBranding)
      expect(service.customBranding).toEqual(customBranding)
    })
  })

  describe('branding application', () => {
    it('should apply default branding to options', async () => {
      const options = {
        page: { format: 'A4' },
        filename: 'test.pdf'
      }

      const brandedOptions = await brandingService.applyBranding(options)
      
      expect(brandedOptions.branding).toBeDefined()
      expect(brandedOptions.branding.companyName).toBe('ProcessAudit AI')
      expect(brandedOptions.branding.primaryColor).toBeDefined()
      expect(brandedOptions.metadata.author).toBe('ProcessAudit AI')
      expect(brandedOptions.metadata.keywords).toContain('ProcessAudit AI')
    })

    it('should preserve existing options when applying branding', async () => {
      const options = {
        page: { format: 'Letter' },
        filename: 'custom-filename.pdf',
        metadata: {
          title: 'Custom Title',
          keywords: ['existing', 'keywords']
        }
      }

      const brandedOptions = await brandingService.applyBranding(options)
      
      expect(brandedOptions.page.format).toBe('Letter')
      expect(brandedOptions.filename).toBe('custom-filename.pdf')
      expect(brandedOptions.metadata.title).toBe('Custom Title')
      expect(brandedOptions.metadata.keywords).toContain('existing')
      expect(brandedOptions.metadata.keywords).toContain('ProcessAudit AI')
    })

    it('should allow branding override in options', async () => {
      const options = {
        page: { format: 'A4' },
        filename: 'test.pdf',
        branding: {
          companyName: 'Override Corp',
          primaryColor: '#00ff00'
        }
      }

      const brandedOptions = await brandingService.applyBranding(options)
      
      expect(brandedOptions.branding.companyName).toBe('Override Corp')
      expect(brandedOptions.branding.primaryColor).toBe('#00ff00')
    })

    it('should calculate branded margins', async () => {
      const options = {
        page: {
          format: 'A4',
          margins: { top: 30, bottom: 30, left: 40, right: 40 }
        },
        filename: 'test.pdf',
        branding: {
          logo: 'data:image/png;base64,fake-logo-data'
        }
      }

      const brandedOptions = await brandingService.applyBranding(options)
      
      expect(brandedOptions.page.margins.top).toBeGreaterThanOrEqual(80) // Extra space for logo
    })
  })

  describe('organization branding', () => {
    it('should get default branding for null organization', async () => {
      const branding = await brandingService.getBranding(null)
      
      expect(branding.companyName).toBe('ProcessAudit AI')
      expect(branding.primaryColor).toBeDefined()
    })

    it('should attempt to fetch organization branding', async () => {
      const branding = await brandingService.getBranding('org123')
      
      // Should return default or organization-specific branding
      expect(branding).toBeDefined()
      expect(branding.companyName).toBeDefined()
    })

    it('should cache organization branding', async () => {
      const branding1 = await brandingService.getBranding('org456')
      const branding2 = await brandingService.getBranding('org456')
      
      // Should be cached (same reference)
      expect(branding1).toBe(branding2)
    })

    it('should fall back to default on organization fetch error', async () => {
      // This tests the error handling in _fetchOrganizationBranding
      const branding = await brandingService.getBranding('invalid-org')
      
      expect(branding).toBeDefined()
      expect(branding.companyName).toBeDefined()
    })

    it('should register custom branding for organization', async () => {
      const customBranding = {
        companyName: 'Registered Corp',
        primaryColor: '#purple',
        secondaryColor: '#gold'
      }

      await brandingService.registerBranding('org789', customBranding)
      
      const retrievedBranding = await brandingService.getBranding('org789')
      expect(retrievedBranding.companyName).toBe('Registered Corp')
    })
  })

  describe('color palette generation', () => {
    it('should generate color palette from branding', () => {
      const branding = {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b'
      }

      const palette = brandingService.generateColorPalette(branding)
      
      expect(palette.primary).toBe('#2563eb')
      expect(palette.secondary).toBe('#64748b')
      expect(palette.text).toBeDefined()
      expect(palette.background).toBe('#ffffff')
      expect(palette.success).toBeDefined()
      expect(palette.warning).toBeDefined()
      expect(palette.error).toBeDefined()
    })

    it('should use default colors when branding colors missing', () => {
      const branding = {}

      const palette = brandingService.generateColorPalette(branding)
      
      expect(palette.primary).toBe(brandingService.defaultBranding.primaryColor)
      expect(palette.secondary).toBe(brandingService.defaultBranding.secondaryColor)
    })
  })

  describe('font configuration', () => {
    it('should get font configuration from branding', () => {
      const branding = {
        fontFamily: 'Arial'
      }

      const fonts = brandingService.getFontConfiguration(branding)
      
      expect(fonts.primary).toBe('Arial')
      expect(fonts.heading).toBe('Arial')
      expect(fonts.body).toBe('Arial')
      expect(fonts.mono).toBe('Courier')
      expect(fonts.sizes).toBeDefined()
      expect(fonts.weights).toBeDefined()
    })

    it('should use default font when not specified', () => {
      const branding = {}

      const fonts = brandingService.getFontConfiguration(branding)
      
      expect(fonts.primary).toBe(brandingService.defaultBranding.fontFamily)
      expect(fonts.sizes.title).toBe(24)
      expect(fonts.sizes.body).toBe(12)
      expect(fonts.weights.bold).toBe(700)
    })

    it('should have consistent font sizes', () => {
      const fonts = brandingService.getFontConfiguration({})
      
      expect(fonts.sizes.title).toBeGreaterThan(fonts.sizes.heading1)
      expect(fonts.sizes.heading1).toBeGreaterThan(fonts.sizes.heading2)
      expect(fonts.sizes.heading2).toBeGreaterThan(fonts.sizes.body)
      expect(fonts.sizes.body).toBeGreaterThan(fonts.sizes.small)
    })
  })

  describe('logo configuration', () => {
    it('should return null for missing logo', async () => {
      const branding = {}

      const logoConfig = await brandingService.getLogoConfiguration(branding)
      
      expect(logoConfig).toBeNull()
    })

    it('should process base64 logo', async () => {
      const branding = {
        logo: 'data:image/png;base64,fake-logo-data'
      }

      const logoConfig = await brandingService.getLogoConfiguration(branding)
      
      expect(logoConfig).toBeDefined()
      expect(logoConfig.data).toBe('data:image/png;base64,fake-logo-data')
      expect(logoConfig.width).toBeDefined()
      expect(logoConfig.height).toBeDefined()
      expect(logoConfig.position).toBeDefined()
    })

    it('should handle logo processing errors gracefully', async () => {
      const branding = {
        logo: 'invalid-logo-data'
      }

      const logoConfig = await brandingService.getLogoConfiguration(branding)
      
      // Should return null on processing error
      expect(logoConfig).toBeNull()
    })

    it('should set default logo dimensions', async () => {
      const branding = {
        logo: 'data:image/png;base64,valid-data'
      }

      const logoConfig = await brandingService.getLogoConfiguration(branding)
      
      expect(logoConfig.width).toBe(120)
      expect(logoConfig.height).toBe(40)
      expect(logoConfig.position).toBe('header-left')
      expect(logoConfig.margin).toBe(10)
    })
  })

  describe('branding validation', () => {
    it('should validate hex colors correctly', () => {
      const validBranding = {
        companyName: 'Valid Corp',
        primaryColor: '#2563eb',
        secondaryColor: '#64748b'
      }

      const validated = brandingService._validateBranding(validBranding)
      
      expect(validated.primaryColor).toBe('#2563eb')
      expect(validated.secondaryColor).toBe('#64748b')
      expect(validated.companyName).toBe('Valid Corp')
    })

    it('should remove invalid hex colors', () => {
      const invalidBranding = {
        companyName: 'Invalid Corp',
        primaryColor: 'not-a-color',
        secondaryColor: '#invalid'
      }

      const validated = brandingService._validateBranding(invalidBranding)
      
      expect(validated.primaryColor).toBeUndefined()
      expect(validated.secondaryColor).toBeUndefined()
      expect(validated.companyName).toBe('Invalid Corp')
    })

    it('should remove invalid company name', () => {
      const invalidBranding = {
        companyName: 12345, // Not a string
        primaryColor: '#2563eb'
      }

      const validated = brandingService._validateBranding(invalidBranding)
      
      expect(validated.companyName).toBeUndefined()
      expect(validated.primaryColor).toBe('#2563eb')
    })

    it('should validate various hex color formats', () => {
      const testCases = [
        { color: '#fff', valid: true },
        { color: '#ffffff', valid: true },
        { color: '#FFF', valid: true },
        { color: '#FFFFFF', valid: true },
        { color: '#123abc', valid: true },
        { color: 'ffffff', valid: false },
        { color: '#gggggg', valid: false },
        { color: '#12345', valid: false },
        { color: 'blue', valid: false }
      ]

      testCases.forEach(({ color, valid }) => {
        const result = brandingService._isValidHexColor(color)
        expect(result).toBe(valid)
      })
    })
  })

  describe('caching behavior', () => {
    it('should cache organization branding', async () => {
      await brandingService.getBranding('cache-test-org')
      
      const stats = brandingService.getStats()
      expect(stats.cachedBrandings).toBe(1)
    })

    it('should clear cache successfully', async () => {
      await brandingService.getBranding('clear-test-org')
      expect(brandingService.getStats().cachedBrandings).toBe(1)
      
      brandingService.clearCache()
      expect(brandingService.getStats().cachedBrandings).toBe(0)
    })

    it('should use cached branding on second request', async () => {
      const branding1 = await brandingService.getBranding('same-org')
      const branding2 = await brandingService.getBranding('same-org')
      
      // Should be the same cached object
      expect(branding1).toBe(branding2)
    })
  })

  describe('statistics', () => {
    it('should provide branding statistics', () => {
      const stats = brandingService.getStats()
      
      expect(stats).toHaveProperty('cachedBrandings')
      expect(stats).toHaveProperty('defaultBranding')
      expect(stats).toHaveProperty('customBranding')
      
      expect(typeof stats.cachedBrandings).toBe('number')
      expect(typeof stats.defaultBranding).toBe('boolean')
      expect(typeof stats.customBranding).toBe('boolean')
    })

    it('should update cache statistics', async () => {
      const initialStats = brandingService.getStats()
      
      await brandingService.getBranding('stats-org-1')
      await brandingService.getBranding('stats-org-2')
      
      const updatedStats = brandingService.getStats()
      expect(updatedStats.cachedBrandings).toBe(initialStats.cachedBrandings + 2)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null branding input', () => {
      const result = brandingService._validateBranding(null)
      expect(result).toEqual({})
    })

    it('should handle undefined branding input', () => {
      const result = brandingService._validateBranding(undefined)
      expect(result).toEqual({})
    })

    it('should handle empty branding object', () => {
      const result = brandingService._validateBranding({})
      expect(result).toEqual({})
    })

    it('should handle organization branding fetch failure gracefully', async () => {
      // Mock a failed fetch by using an organization ID that would cause an error
      const branding = await brandingService.getBranding('error-org')
      
      // Should fall back to default branding
      expect(branding).toBeDefined()
      expect(branding.companyName).toBeDefined()
    })

    it('should handle partial branding objects', () => {
      const partialBranding = {
        primaryColor: '#ff0000'
        // Missing other fields
      }

      const validated = brandingService._validateBranding(partialBranding)
      expect(validated.primaryColor).toBe('#ff0000')
      expect(validated).not.toHaveProperty('companyName')
    })
  })
})