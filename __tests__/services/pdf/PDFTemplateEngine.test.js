/**
 * PDFTemplateEngine Service Tests
 * 
 * Comprehensive test suite for PDF template management functionality
 * Tests template registration, retrieval, caching, and validation
 */

const PDFTemplateEngine = require('../../../services/pdf/PDFTemplateEngine')

describe('PDFTemplateEngine', () => {
  let templateEngine

  beforeEach(() => {
    templateEngine = new PDFTemplateEngine()
  })

  afterEach(() => {
    templateEngine.clearCache()
  })

  describe('initialization', () => {
    it('should initialize with default templates', () => {
      expect(templateEngine).toBeInstanceOf(PDFTemplateEngine)
      expect(templateEngine.defaultTemplates).toBeDefined()
      expect(templateEngine.customTemplates).toBeDefined()
      expect(templateEngine.templateCache).toBeDefined()
    })

    it('should initialize with custom templates', () => {
      const customTemplates = {
        'custom-audit': {
          id: 'custom-audit',
          name: 'Custom Audit Template',
          type: 'audit-report'
        }
      }
      
      const engine = new PDFTemplateEngine(customTemplates)
      expect(engine.customTemplates).toEqual(customTemplates)
    })

    it('should have default templates for all document types', () => {
      const availableTypes = ['audit-report', 'sop-document', 'executive-summary']
      
      availableTypes.forEach(type => {
        expect(templateEngine.defaultTemplates[type]).toBeDefined()
        expect(templateEngine.defaultTemplates[type].type).toBe(type)
        expect(templateEngine.defaultTemplates[type].sections).toBeInstanceOf(Array)
      })
    })
  })

  describe('template retrieval', () => {
    it('should get default template for document type', async () => {
      const template = await templateEngine.getTemplate('audit-report')
      
      expect(template).toBeDefined()
      expect(template.type).toBe('audit-report')
      expect(template.name).toContain('Audit Report')
      expect(template.sections).toBeInstanceOf(Array)
      expect(template.sections.length).toBeGreaterThan(0)
    })

    it('should get SOP document template', async () => {
      const template = await templateEngine.getTemplate('sop-document')
      
      expect(template).toBeDefined()
      expect(template.type).toBe('sop-document')
      expect(template.name).toContain('SOP')
      expect(template.sections).toBeInstanceOf(Array)
      expect(template.styling).toBeDefined()
    })

    it('should get executive summary template', async () => {
      const template = await templateEngine.getTemplate('executive-summary')
      
      expect(template).toBeDefined()
      expect(template.type).toBe('executive-summary')
      expect(template.sections).toBeInstanceOf(Array)
    })

    it('should throw error for unsupported document type', async () => {
      await expect(templateEngine.getTemplate('unsupported-type'))
        .rejects.toThrow('No template found for document type: unsupported-type')
    })

    it('should use custom template when provided', async () => {
      const customTemplate = {
        id: 'custom-test',
        name: 'Custom Test Template',
        type: 'audit-report',
        sections: [
          {
            id: 'custom-section',
            title: 'Custom Section',
            type: 'overview'
          }
        ]
      }

      const template = await templateEngine.getTemplate('audit-report', customTemplate)
      
      expect(template.id).toBe('custom-test')
      expect(template.name).toBe('Custom Test Template')
      expect(template.sections[0].id).toBe('custom-section')
    })
  })

  describe('template caching', () => {
    it('should cache templates after first retrieval', async () => {
      const template1 = await templateEngine.getTemplate('audit-report')
      const template2 = await templateEngine.getTemplate('audit-report')
      
      // Should be the same object reference (cached)
      expect(template1).toBe(template2)
    })

    it('should use separate cache entries for different custom templates', async () => {
      const custom1 = { id: 'custom1', name: 'Custom 1', type: 'audit-report', sections: [] }
      const custom2 = { id: 'custom2', name: 'Custom 2', type: 'audit-report', sections: [] }
      
      const template1 = await templateEngine.getTemplate('audit-report', custom1)
      const template2 = await templateEngine.getTemplate('audit-report', custom2)
      
      expect(template1.id).toBe('custom1')
      expect(template2.id).toBe('custom2')
      expect(template1).not.toBe(template2)
    })

    it('should clear cache successfully', async () => {
      await templateEngine.getTemplate('audit-report')
      expect(templateEngine.templateCache.size).toBeGreaterThan(0)
      
      templateEngine.clearCache()
      expect(templateEngine.templateCache.size).toBe(0)
    })
  })

  describe('template registration', () => {
    it('should register custom template successfully', () => {
      const customTemplate = {
        id: 'registered-template',
        name: 'Registered Template',
        type: 'audit-report',
        sections: []
      }

      templateEngine.registerTemplate('registered-template', customTemplate)
      
      expect(templateEngine.customTemplates['registered-template']).toEqual(customTemplate)
    })

    it('should clear cache when registering new template', async () => {
      await templateEngine.getTemplate('audit-report')
      expect(templateEngine.templateCache.size).toBeGreaterThan(0)

      const customTemplate = {
        id: 'new-template',
        name: 'New Template',
        type: 'audit-report',
        sections: []
      }

      templateEngine.registerTemplate('new-template', customTemplate)
      expect(templateEngine.templateCache.size).toBe(0)
    })
  })

  describe('available templates', () => {
    it('should list available templates for document type', () => {
      const templates = templateEngine.getAvailableTemplates('audit-report')
      
      expect(templates).toBeInstanceOf(Array)
      expect(templates.length).toBeGreaterThan(0)
      
      const defaultTemplate = templates.find(t => t.isDefault)
      expect(defaultTemplate).toBeDefined()
      expect(defaultTemplate.type).toBe('audit-report')
    })

    it('should include custom templates in available list', () => {
      const customTemplate = {
        id: 'custom-available',
        name: 'Custom Available Template',
        type: 'audit-report',
        sections: []
      }

      templateEngine.registerTemplate('custom-available', customTemplate)
      
      const templates = templateEngine.getAvailableTemplates('audit-report')
      const customEntry = templates.find(t => t.id === 'custom-available')
      
      expect(customEntry).toBeDefined()
      expect(customEntry.isDefault).toBe(false)
      expect(customEntry.name).toBe('Custom Available Template')
    })

    it('should return empty array for unsupported document type', () => {
      const templates = templateEngine.getAvailableTemplates('unsupported-type')
      expect(templates).toEqual([])
    })
  })

  describe('template structure validation', () => {
    it('should have required sections in audit report template', async () => {
      const template = await templateEngine.getTemplate('audit-report')
      
      const expectedSections = [
        'cover-page',
        'executive-summary', 
        'process-analysis',
        'automation-opportunities',
        'implementation-roadmap',
        'guidance-recommendations'
      ]

      expectedSections.forEach(sectionId => {
        const section = template.sections.find(s => s.id === sectionId)
        expect(section).toBeDefined()
      })
    })

    it('should have required sections in SOP template', async () => {
      const template = await templateEngine.getTemplate('sop-document')
      
      const expectedSections = [
        'sop-header',
        'sop-purpose-scope',
        'sop-responsibilities',
        'sop-procedures',
        'sop-references',
        'sop-revision-history'
      ]

      expectedSections.forEach(sectionId => {
        const section = template.sections.find(s => s.id === sectionId)
        expect(section).toBeDefined()
      })
    })

    it('should have valid styling configuration', async () => {
      const template = await templateEngine.getTemplate('audit-report')
      
      expect(template.styling).toBeDefined()
      expect(typeof template.styling.coverPage).toBe('boolean')
      expect(typeof template.styling.tableOfContents).toBe('boolean')
      expect(typeof template.styling.headerFooter).toBe('boolean')
    })

    it('should properly merge custom template with defaults', async () => {
      const customTemplate = {
        id: 'merge-test',
        name: 'Merge Test Template',
        type: 'audit-report',
        styling: {
          watermark: 'CONFIDENTIAL'
        }
      }

      const template = await templateEngine.getTemplate('audit-report', customTemplate)
      
      // Should have custom styling merged with default
      expect(template.styling.watermark).toBe('CONFIDENTIAL')
      expect(template.styling.coverPage).toBeDefined() // From default
      expect(template.styling.headerFooter).toBeDefined() // From default
      
      // Should have custom metadata
      expect(template.id).toBe('merge-test')
      expect(template.name).toBe('Merge Test Template')
    })
  })

  describe('statistics', () => {
    it('should provide template statistics', () => {
      const stats = templateEngine.getStats()
      
      expect(stats).toHaveProperty('totalTemplates')
      expect(stats).toHaveProperty('defaultTemplates')
      expect(stats).toHaveProperty('customTemplates')
      expect(stats).toHaveProperty('cacheSize')
      expect(stats).toHaveProperty('templatesByType')
      
      expect(stats.defaultTemplates).toBeGreaterThan(0)
      expect(typeof stats.totalTemplates).toBe('number')
    })

    it('should update statistics when custom templates are added', () => {
      const initialStats = templateEngine.getStats()
      
      const customTemplate = {
        id: 'stats-test',
        name: 'Stats Test Template',
        type: 'audit-report',
        sections: []
      }

      templateEngine.registerTemplate('stats-test', customTemplate)
      
      const updatedStats = templateEngine.getStats()
      expect(updatedStats.customTemplates).toBe(initialStats.customTemplates + 1)
      expect(updatedStats.totalTemplates).toBe(initialStats.totalTemplates + 1)
    })

    it('should track cache size in statistics', async () => {
      const initialStats = templateEngine.getStats()
      expect(initialStats.cacheSize).toBe(0)
      
      await templateEngine.getTemplate('audit-report')
      
      const updatedStats = templateEngine.getStats()
      expect(updatedStats.cacheSize).toBe(1)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null custom template gracefully', async () => {
      const template = await templateEngine.getTemplate('audit-report', null)
      
      expect(template).toBeDefined()
      expect(template.type).toBe('audit-report')
    })

    it('should handle undefined custom template gracefully', async () => {
      const template = await templateEngine.getTemplate('audit-report', undefined)
      
      expect(template).toBeDefined()
      expect(template.type).toBe('audit-report')
    })

    it('should handle custom template without sections', async () => {
      const customTemplate = {
        id: 'no-sections',
        name: 'No Sections Template',
        type: 'audit-report'
        // Note: no sections property
      }

      const template = await templateEngine.getTemplate('audit-report', customTemplate)
      
      expect(template.sections).toBeInstanceOf(Array)
      expect(template.sections.length).toBeGreaterThan(0) // Should use default sections
    })

    it('should handle empty sections array', async () => {
      const customTemplate = {
        id: 'empty-sections',
        name: 'Empty Sections Template',
        type: 'audit-report',
        sections: []
      }

      const template = await templateEngine.getTemplate('audit-report', customTemplate)
      
      expect(template.sections).toBeInstanceOf(Array)
      expect(template.sections.length).toBe(0) // Should respect custom empty sections
    })
  })
})