/**
 * PDFTemplateEngine Service - ProcessAudit AI
 * 
 * Manages PDF templates and layouts for different document types
 * Provides template selection, customization, and caching
 */

/**
 * PDF Template Engine
 * Handles template management and selection for PDF generation
 */
class PDFTemplateEngine {
  constructor(customTemplates = {}) {
    this.customTemplates = customTemplates
    this.templateCache = new Map()
    
    // Initialize default templates
    this.defaultTemplates = this._initializeDefaultTemplates()
  }

  /**
   * Get template for document type
   * @param {string} documentType - Type of document (audit-report, sop-document, etc.)
   * @param {Object} customTemplate - Custom template override
   * @returns {Promise<Object>} Template configuration
   */
  async getTemplate(documentType, customTemplate = null) {
    const cacheKey = `${documentType}-${customTemplate?.id || 'default'}`
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)
    }
    
    let template
    
    if (customTemplate) {
      template = this._mergeWithDefaults(customTemplate, documentType)
    } else {
      template = this.defaultTemplates[documentType]
    }
    
    if (!template) {
      throw new Error(`No template found for document type: ${documentType}`)
    }
    
    // Cache the resolved template
    this.templateCache.set(cacheKey, template)
    
    return template
  }

  /**
   * Register a custom template
   * @param {string} templateId - Unique template identifier
   * @param {Object} template - Template configuration
   */
  registerTemplate(templateId, template) {
    this.customTemplates[templateId] = template
    
    // Clear cache to force re-resolution
    this.templateCache.clear()
  }

  /**
   * Get all available templates for a document type
   * @param {string} documentType - Document type to get templates for
   * @returns {Array} Available templates
   */
  getAvailableTemplates(documentType) {
    const templates = []
    
    // Add default template
    if (this.defaultTemplates[documentType]) {
      templates.push({
        id: 'default',
        name: `Default ${documentType.replace('-', ' ').toUpperCase()}`,
        type: documentType,
        isDefault: true
      })
    }
    
    // Add custom templates
    Object.entries(this.customTemplates).forEach(([id, template]) => {
      if (template.type === documentType) {
        templates.push({
          id,
          ...template,
          isDefault: false
        })
      }
    })
    
    return templates
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear()
  }

  /**
   * Get template statistics
   * @returns {Object} Template usage statistics
   */
  getStats() {
    return {
      totalTemplates: Object.keys(this.defaultTemplates).length + Object.keys(this.customTemplates).length,
      defaultTemplates: Object.keys(this.defaultTemplates).length,
      customTemplates: Object.keys(this.customTemplates).length,
      cacheSize: this.templateCache.size,
      templatesByType: this._getTemplatesByType()
    }
  }

  // Private methods

  /**
   * Initialize default templates for each document type
   * @private
   */
  _initializeDefaultTemplates() {
    return {
      'audit-report': {
        id: 'default-audit-report',
        name: 'Default Audit Report',
        type: 'audit-report',
        description: 'Standard audit report template with all sections',
        sections: [
          {
            id: 'cover-page',
            title: 'Cover Page',
            type: 'overview',
            data: {},
            pageBreak: true
          },
          {
            id: 'executive-summary',
            title: 'Executive Summary',
            type: 'overview',
            data: {},
            pageBreak: true
          },
          {
            id: 'process-analysis',
            title: 'Process Analysis',
            type: 'overview',
            data: {}
          },
          {
            id: 'automation-opportunities',
            title: 'Automation Opportunities',
            type: 'opportunities',
            data: {},
            pageBreak: true
          },
          {
            id: 'implementation-roadmap',
            title: 'Implementation Roadmap',
            type: 'implementation',
            data: {},
            pageBreak: true
          },
          {
            id: 'guidance-recommendations',
            title: 'Guidance & Recommendations',
            type: 'guidance',
            data: {}
          }
        ],
        styling: {
          coverPage: true,
          tableOfContents: true,
          headerFooter: true,
          layoutType: 'standard'
        }
      },
      
      'sop-document': {
        id: 'default-sop-document',
        name: 'Default SOP Document',
        type: 'sop-document',
        description: 'Standard Operating Procedure template',
        sections: [
          {
            id: 'sop-header',
            title: 'Document Header',
            type: 'sop',
            data: {},
            pageBreak: false
          },
          {
            id: 'sop-purpose-scope',
            title: 'Purpose & Scope',
            type: 'sop',
            data: {}
          },
          {
            id: 'sop-responsibilities',
            title: 'Responsibilities',
            type: 'sop',
            data: {}
          },
          {
            id: 'sop-procedures',
            title: 'Procedures',
            type: 'sop',
            data: {},
            pageBreak: true
          },
          {
            id: 'sop-references',
            title: 'References & Related Documents',
            type: 'sop',
            data: {}
          },
          {
            id: 'sop-revision-history',
            title: 'Revision History',
            type: 'sop',
            data: {}
          }
        ],
        styling: {
          coverPage: true,
          tableOfContents: false,
          headerFooter: true,
          layoutType: 'structured'
        }
      },
      
      'executive-summary': {
        id: 'default-executive-summary',
        name: 'Default Executive Summary',
        type: 'executive-summary',
        description: 'Concise executive summary template',
        sections: [
          {
            id: 'executive-overview',
            title: 'Executive Overview',
            type: 'overview',
            data: {}
          },
          {
            id: 'key-findings',
            title: 'Key Findings',
            type: 'overview',
            data: {}
          },
          {
            id: 'recommendations',
            title: 'Recommendations',
            type: 'opportunities',
            data: {}
          },
          {
            id: 'next-steps',
            title: 'Next Steps',
            type: 'implementation',
            data: {}
          }
        ],
        styling: {
          coverPage: false,
          tableOfContents: false,
          headerFooter: true,
          layoutType: 'concise'
        }
      }
    }
  }

  /**
   * Merge custom template with default template
   * @private
   */
  _mergeWithDefaults(customTemplate, documentType) {
    const defaultTemplate = this.defaultTemplates[documentType]
    
    if (!defaultTemplate) {
      return customTemplate
    }
    
    return {
      ...defaultTemplate,
      ...customTemplate,
      sections: customTemplate.sections || defaultTemplate.sections,
      styling: {
        ...defaultTemplate.styling,
        ...customTemplate.styling
      }
    }
  }

  /**
   * Get templates grouped by type
   * @private
   */
  _getTemplatesByType() {
    const byType = {}
    
    // Count default templates
    Object.entries(this.defaultTemplates).forEach(([type, template]) => {
      if (!byType[type]) byType[type] = 0
      byType[type]++
    })
    
    // Count custom templates
    Object.values(this.customTemplates).forEach(template => {
      if (!byType[template.type]) byType[template.type] = 0
      byType[template.type]++
    })
    
    return byType
  }
}

module.exports = PDFTemplateEngine