/**
 * PDFComponentRenderer Service - ProcessAudit AI
 * 
 * Renders React PDF components to PDF buffers using @react-pdf/renderer
 * Bridges the gap between React components and PDF generation service
 */

const React = require('react')

// Conditional import for testing environment
let renderToBuffer

if (process.env.NODE_ENV === 'test') {
  renderToBuffer = jest.fn().mockResolvedValue(Buffer.from('mock-component-pdf-data'))
} else {
  // Use dynamic import for ESM compatibility
  renderToBuffer = null // Will be loaded dynamically
}

// Import PDF Components
// Note: These imports would need to be dynamic in a server environment
// For now, we'll handle them as dynamic imports to avoid SSR issues

/**
 * PDF Component Renderer
 * Handles rendering of React PDF components to PDF buffers
 */
class PDFComponentRenderer {
  constructor() {
    this.componentCache = new Map()
    this.renderStats = {
      totalRenders: 0,
      averageRenderTime: 0,
      rendersByType: {},
      errors: 0
    }
  }

  /**
   * Render PDF component to buffer
   * @param {string} documentType - Type of document to render
   * @param {Object} data - Data to pass to the component
   * @param {Object} options - Rendering options
   * @returns {Promise<Buffer>} PDF buffer
   */
  async renderToBuffer(documentType, data, options = {}) {
    const startTime = Date.now()
    
    try {
      // Load renderToBuffer dynamically if not in test environment
      if (!renderToBuffer && process.env.NODE_ENV !== 'test') {
        const { renderToBuffer: reactPdfRender } = await import('@react-pdf/renderer')
        renderToBuffer = reactPdfRender
      }

      // Get the appropriate PDF component
      const PDFComponent = await this._getComponentForType(documentType)
      
      if (!PDFComponent) {
        throw new Error(`No PDF component found for document type: ${documentType}`)
      }

      // Create React element with data and options
      const element = React.createElement(PDFComponent, {
        ...data,
        ...options
      })

      // Render to PDF buffer
      console.log(`Rendering PDF component for type: ${documentType}`)
      const buffer = await renderToBuffer(element)
      
      // Update statistics
      const renderTime = Date.now() - startTime
      this._updateRenderStats(documentType, renderTime, true)
      
      console.log(`PDF component rendered successfully in ${renderTime}ms`)
      return buffer
      
    } catch (error) {
      const renderTime = Date.now() - startTime
      this._updateRenderStats(documentType, renderTime, false)
      
      console.error('PDF component rendering failed:', error)
      throw new Error(`PDF rendering failed: ${error.message}`)
    }
  }

  /**
   * Preview PDF component (generate first few pages)
   * @param {string} documentType - Type of document to preview
   * @param {Object} data - Data to pass to the component
   * @param {Object} options - Preview options
   * @returns {Promise<Buffer>} PDF buffer for preview
   */
  async renderPreview(documentType, data, options = {}) {
    // For now, render the full PDF (preview functionality would need additional implementation)
    // In a full implementation, this would render only the first few pages
    return await this.renderToBuffer(documentType, data, {
      ...options,
      previewMode: true
    })
  }

  /**
   * Get available document types
   * @returns {Array<string>} Available document types
   */
  getAvailableTypes() {
    return ['audit-report', 'sop-document', 'executive-summary']
  }

  /**
   * Check if document type is supported
   * @param {string} documentType - Document type to check
   * @returns {boolean} Whether the type is supported
   */
  isTypeSupported(documentType) {
    return this.getAvailableTypes().includes(documentType)
  }

  /**
   * Get rendering statistics
   * @returns {Object} Rendering statistics
   */
  getStats() {
    return { ...this.renderStats }
  }

  /**
   * Reset rendering statistics
   */
  resetStats() {
    this.renderStats = {
      totalRenders: 0,
      averageRenderTime: 0,
      rendersByType: {},
      errors: 0
    }
  }

  /**
   * Clear component cache
   */
  clearCache() {
    this.componentCache.clear()
  }

  // Private methods

  /**
   * Get PDF component for document type
   * @private
   */
  async _getComponentForType(documentType) {
    // Check cache first
    if (this.componentCache.has(documentType)) {
      return this.componentCache.get(documentType)
    }

    let component = null

    try {
      switch (documentType) {
        case 'audit-report':
          component = await this._loadAuditReportComponent()
          break
          
        case 'sop-document':
          component = await this._loadSOPDocumentComponent()
          break
          
        case 'executive-summary':
          component = await this._loadExecutiveSummaryComponent()
          break
          
        default:
          throw new Error(`Unsupported document type: ${documentType}`)
      }

      // Cache the component
      if (component) {
        this.componentCache.set(documentType, component)
      }

      return component
      
    } catch (error) {
      console.error(`Failed to load PDF component for type ${documentType}:`, error)
      return null
    }
  }

  /**
   * Load Audit Report PDF Component
   * @private
   */
  async _loadAuditReportComponent() {
    try {
      // Dynamic import to avoid SSR issues
      const { default: AuditReportPDF } = await import('../../components/pdf/AuditReportPDF.jsx')
      return AuditReportPDF
    } catch (error) {
      console.error('Failed to load AuditReportPDF component:', error)
      throw new Error('AuditReportPDF component not available')
    }
  }

  /**
   * Load SOP Document PDF Component
   * @private
   */
  async _loadSOPDocumentComponent() {
    try {
      const { default: SOPDocumentPDF } = await import('../../components/pdf/SOPDocumentPDF.jsx')
      return SOPDocumentPDF
    } catch (error) {
      console.error('Failed to load SOPDocumentPDF component:', error)
      throw new Error('SOPDocumentPDF component not available')
    }
  }

  /**
   * Load Executive Summary PDF Component
   * @private
   */
  async _loadExecutiveSummaryComponent() {
    try {
      const { default: ExecutiveSummaryPDF } = await import('../../components/pdf/ExecutiveSummaryPDF.jsx')
      return ExecutiveSummaryPDF
    } catch (error) {
      console.error('Failed to load ExecutiveSummaryPDF component:', error)
      throw new Error('ExecutiveSummaryPDF component not available')
    }
  }

  /**
   * Update rendering statistics
   * @private
   */
  _updateRenderStats(documentType, renderTime, success) {
    this.renderStats.totalRenders++
    
    if (success) {
      // Update average render time
      const totalTime = this.renderStats.averageRenderTime * (this.renderStats.totalRenders - 1) + renderTime
      this.renderStats.averageRenderTime = totalTime / this.renderStats.totalRenders
      
      // Update by type
      if (!this.renderStats.rendersByType[documentType]) {
        this.renderStats.rendersByType[documentType] = {
          count: 0,
          averageTime: 0,
          errors: 0
        }
      }
      
      const typeStats = this.renderStats.rendersByType[documentType]
      const newCount = typeStats.count + 1
      const totalTypeTime = typeStats.averageTime * typeStats.count + renderTime
      
      typeStats.count = newCount
      typeStats.averageTime = totalTypeTime / newCount
      
    } else {
      this.renderStats.errors++
      
      if (!this.renderStats.rendersByType[documentType]) {
        this.renderStats.rendersByType[documentType] = {
          count: 0,
          averageTime: 0,
          errors: 0
        }
      }
      
      this.renderStats.rendersByType[documentType].errors++
    }
  }
}

module.exports = PDFComponentRenderer