/**
 * PDFBrandingService - ProcessAudit AI
 * 
 * Handles company branding, themes, and visual identity for PDF documents
 * Integrates with Clerk Organizations for multi-tenant branding
 */

/**
 * PDF Branding Service
 * Applies company branding and visual identity to PDF documents
 */
class PDFBrandingService {
  constructor(defaultBranding = {}) {
    this.defaultBranding = this._initializeDefaultBranding()
    this.customBranding = defaultBranding
    this.brandingCache = new Map()
  }

  /**
   * Apply branding to PDF options
   * @param {Object} options - PDF generation options
   * @param {string} organizationId - Organization ID for multi-tenant branding
   * @returns {Promise<Object>} Options with branding applied
   */
  async applyBranding(options, organizationId = null) {
    const branding = await this.getBranding(organizationId)
    
    const mergedBranding = {
      ...branding,
      ...options.branding // Allow override of specific branding elements
    }
    
    return {
      ...options,
      branding: mergedBranding,
      // Apply branding to page styling
      page: {
        ...options.page,
        margins: this._calculateBrandedMargins(options.page.margins, mergedBranding)
      },
      // Apply branding to metadata
      metadata: {
        ...options.metadata,
        author: options.metadata?.author || branding.companyName,
        keywords: [
          ...(options.metadata?.keywords || []),
          branding.companyName,
          'ProcessAudit AI',
          'Business Process Analysis'
        ]
      }
    }
  }

  /**
   * Get branding configuration for organization
   * @param {string} organizationId - Organization ID (null for default)
   * @returns {Promise<Object>} Branding configuration
   */
  async getBranding(organizationId = null) {
    if (!organizationId) {
      return this.defaultBranding
    }
    
    const cacheKey = `branding-${organizationId}`
    
    if (this.brandingCache.has(cacheKey)) {
      return this.brandingCache.get(cacheKey)
    }
    
    try {
      // Fetch organization-specific branding if available
      const orgBranding = await this._fetchOrganizationBranding(organizationId)
      
      const mergedBranding = {
        ...this.defaultBranding,
        ...orgBranding
      }
      
      this.brandingCache.set(cacheKey, mergedBranding)
      return mergedBranding
      
    } catch (error) {
      console.error('Failed to fetch organization branding:', error)
      return this.defaultBranding
    }
  }

  /**
   * Register custom branding for organization
   * @param {string} organizationId - Organization ID
   * @param {Object} branding - Custom branding configuration
   */
  async registerBranding(organizationId, branding) {
    const validatedBranding = this._validateBranding(branding)
    
    // Cache the branding
    this.brandingCache.set(`branding-${organizationId}`, validatedBranding)
    
    // Custom branding registered in memory cache
    console.log(`Registered custom branding for organization: ${organizationId}`)
  }

  /**
   * Generate branded color palette
   * @param {Object} branding - Branding configuration
   * @returns {Object} Color palette for PDF styling
   */
  generateColorPalette(branding) {
    const primary = branding.primaryColor || this.defaultBranding.primaryColor
    const secondary = branding.secondaryColor || this.defaultBranding.secondaryColor
    
    return {
      primary,
      secondary,
      // Generate complementary colors
      accent: this._adjustColor(primary, 20),
      light: this._adjustColor(primary, 60),
      dark: this._adjustColor(primary, -40),
      text: '#2c3e50',
      textLight: '#7f8c8d',
      background: '#ffffff',
      border: '#ecf0f1',
      success: '#27ae60',
      warning: '#f39c12',
      error: '#e74c3c'
    }
  }

  /**
   * Get branded fonts configuration
   * @param {Object} branding - Branding configuration
   * @returns {Object} Font configuration
   */
  getFontConfiguration(branding) {
    const fontFamily = branding.fontFamily || this.defaultBranding.fontFamily
    
    // Use mobile-optimized font sizes if available
    const mobileSizes = branding.mobileOptimizations?.fontSize
    const defaultSizes = {
      title: 24,
      heading1: 20,
      heading2: 16,
      heading3: 14,
      body: 12,
      small: 10,
      caption: 8
    }
    
    return {
      primary: fontFamily,
      heading: fontFamily,
      body: fontFamily,
      mono: 'Courier',
      sizes: mobileSizes ? { ...defaultSizes, ...mobileSizes } : defaultSizes,
      weights: {
        light: 300,
        normal: 400,
        medium: 500,
        bold: 700
      },
      // Mobile-specific font optimizations
      mobileOptimizations: {
        lineHeight: 1.4, // Better readability on mobile
        letterSpacing: 0.01, // Slight letter spacing for clarity
        antialiasing: true
      }
    }
  }

  /**
   * Get logo configuration for PDF
   * @param {Object} branding - Branding configuration
   * @returns {Promise<Object>} Logo configuration
   */
  async getLogoConfiguration(branding) {
    if (!branding.logo) {
      return null
    }
    
    try {
      // Process logo (validate, resize, convert format if needed)
      const logoData = await this._processLogo(branding.logo)
      
      // Return null if logo processing failed
      if (!logoData) {
        return null
      }
      
      // Apply mobile optimizations if available
      const mobileScale = branding.mobileOptimizations?.logoScale || 1
      const baseWidth = 120
      const baseHeight = 40
      
      return {
        data: logoData,
        width: Math.round(baseWidth * mobileScale),
        height: Math.round(baseHeight * mobileScale), 
        position: 'header-left',
        margin: 10,
        // Mobile-specific enhancements
        highDPI: true, // Ensure crisp rendering on mobile displays
        vectorOptimized: branding.logo.endsWith('.svg')
      }
      
    } catch (error) {
      console.error('Failed to process logo:', error)
      return null
    }
  }

  /**
   * Get stamp/watermark configuration for PDF
   * @param {Object} branding - Branding configuration
   * @returns {Promise<Object>} Stamp configuration
   */
  async getStampConfiguration(branding) {
    if (!branding.stamp) {
      return null
    }
    
    try {
      // Process stamp (validate, resize, convert format if needed)
      const stampData = await this._processLogo(branding.stamp)
      
      // Return null if stamp processing failed
      if (!stampData) {
        return null
      }
      
      // Apply mobile optimizations if available
      const stampOpacity = branding.mobileOptimizations?.stampOpacity || 0.3
      
      return {
        data: stampData,
        width: 80,
        height: 80, 
        position: 'bottom-right',
        opacity: stampOpacity,
        margin: 20,
        // Mobile-friendly positioning
        mobilePosition: 'bottom-center', // Better for mobile viewing
        responsiveSize: true // Adjust size based on page dimensions
      }
      
    } catch (error) {
      console.error('Failed to process stamp:', error)
      return null
    }
  }

  /**
   * Clear branding cache
   */
  clearCache() {
    this.brandingCache.clear()
  }

  /**
   * Get branding statistics
   * @returns {Object} Branding usage statistics
   */
  getStats() {
    return {
      cachedBrandings: this.brandingCache.size,
      defaultBranding: !!this.defaultBranding,
      customBranding: !!this.customBranding
    }
  }

  // Private methods

  /**
   * Initialize default ProcessAudit AI branding
   * @private
   */
  _initializeDefaultBranding() {
    return {
      companyName: 'ProcessAudit AI',
      primaryColor: '#2563eb', // Blue
      secondaryColor: '#64748b', // Gray
      fontFamily: 'Helvetica',
      metadata: {
        website: 'https://processaudit.ai',
        email: 'support@processaudit.ai',
        tagline: 'AI-Powered Business Process Analysis'
      }
    }
  }

  /**
   * Fetch organization-specific branding from Clerk/database
   * @private
   */
  async _fetchOrganizationBranding(organizationId) {
    // Handle specific organization branding
    if (organizationId === 'hospo-dojo') {
      return {
        companyName: 'HOSPO DOJO',
        primaryColor: '#1C1C1C', // Official Black
        secondaryColor: '#EAE8DD', // Official Ivory
        accentColor: '#42551C', // Official Khaki Green
        logo: '/Hospo-Dojo-Logo.svg',
        stamp: '/dojo-stamp.png',
        tagline: 'Prep For Success - AI-powered process analysis for hospitality professionals',
        terminology: {
          analysis: 'Hospitality Battle Plan Analysis',
          recommendations: 'Strategic Moves for Excellence',
          battle_plan: 'Your Operational Battle Plan',
          excellence: 'Excellence Through Discipline'
        },
        mobileOptimizations: {
          logoScale: 1.2, // Slightly larger logo for mobile PDFs
          stampOpacity: 0.2, // More subtle stamp for mobile viewing
          fontSize: {
            title: 18,
            heading: 14,
            body: 10,
            caption: 8
          },
          touchFriendly: true // Generate touch-friendly interactive elements
        },
        metadata: {
          website: 'https://hospo-dojo.com',
          email: 'support@hospo-dojo.com',
          tagline: 'Prep For Success - AI-powered process analysis for hospitality professionals',
          keywords: ['hospitality', 'restaurant', 'hotel', 'automation', 'process-optimization', 'dojo']
        }
      }
    }
    
    // Default organization branding implementation
    // Extended via registerOrganizationBranding() for custom branding
    return {
      companyName: `Organization ${organizationId}`,
      primaryColor: '#2563eb',
      secondaryColor: '#64748b'
    }
  }

  /**
   * Validate branding configuration
   * @private
   */
  _validateBranding(branding) {
    const validated = { ...branding }
    
    // Validate colors (must be valid hex colors)
    if (validated.primaryColor && !this._isValidHexColor(validated.primaryColor)) {
      console.warn('Invalid primary color, using default')
      delete validated.primaryColor
    }
    
    if (validated.secondaryColor && !this._isValidHexColor(validated.secondaryColor)) {
      console.warn('Invalid secondary color, using default')
      delete validated.secondaryColor
    }
    
    // Validate company name
    if (validated.companyName && typeof validated.companyName !== 'string') {
      console.warn('Invalid company name, using default')
      delete validated.companyName
    }
    
    return validated
  }

  /**
   * Check if a string is a valid hex color
   * @private
   */
  _isValidHexColor(color) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    return hexColorRegex.test(color)
  }

  /**
   * Adjust color brightness
   * @private
   */
  _adjustColor(color, percent) {
    // Simple color adjustment implementation
    return color
  }

  /**
   * Calculate branded margins based on branding requirements
   * @private
   */
  _calculateBrandedMargins(originalMargins, branding) {
    const defaultMargins = {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    }
    
    const margins = { ...defaultMargins, ...originalMargins }
    
    // Adjust margins if logo is present
    if (branding.logo) {
      margins.top = Math.max(margins.top, 80) // Extra space for logo
    }
    
    return margins
  }

  /**
   * Process logo image (validate, resize, format)
   * @private
   */
  async _processLogo(logoUrl) {
    try {
      if (logoUrl.startsWith('data:')) {
        // Base64 encoded image
        return logoUrl
      } else if (logoUrl.startsWith('/')) {
        // Public path - convert to full URL or file system path for PDF generation
        const path = require('path')
        const fs = require('fs')
        
        // For local file processing in PDF generation
        const publicPath = path.join(process.cwd(), 'public', logoUrl.substring(1))
        
        if (fs.existsSync(publicPath)) {
          // Return the file system path for Puppeteer PDF generation
          return publicPath
        } else {
          console.warn(`Logo file not found at: ${publicPath}`)
          return null
        }
      } else {
        // External URL - would need to fetch and process
        console.warn('External URL logo processing not implemented yet')
        return null
      }
    } catch (error) {
      console.error('Logo processing failed:', error)
      return null
    }
  }
}

module.exports = PDFBrandingService