/**
 * Puppeteer PDF Generator - ProcessAudit AI
 * 
 * Professional PDF generation using Puppeteer + HTML templates
 * Replaces the problematic React-PDF implementation with reliable HTML-to-PDF conversion
 */

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const Handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

/**
 * Puppeteer-based PDF Generator
 * Generates professional business documents using HTML templates and Puppeteer
 */
class PuppeteerPDFGenerator {
  constructor(options = {}) {
    this.templatesDir = options.templatesDir || path.join(process.cwd(), 'templates', 'pdf');
    this.templateCache = new Map();
    
    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
    
    // Statistics
    this.stats = {
      totalGenerated: 0,
      averageGenerationTime: 0,
      generationsByType: {},
      errors: 0
    };
  }

  /**
   * Get Puppeteer options based on environment
   * @private
   */
  async getPuppeteerOptions() {
    if (process.env.NODE_ENV === 'production') {
      return {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      };
    } else {
      // Development environment - use system Chrome
      const systemChromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
        '/usr/bin/google-chrome-stable', // Linux
        '/usr/bin/google-chrome',        // Linux
        '/usr/bin/chromium-browser',     // Linux
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' // Windows
      ];
      
      let executablePath = null;
      
      // Try to find Chrome executable
      const fs = require('fs').promises;
      for (const chromePath of systemChromePaths) {
        try {
          await fs.access(chromePath);
          executablePath = chromePath;
          console.log(`🌐 Found Chrome at: ${chromePath}`);
          break;
        } catch (error) {
          // Continue searching
        }
      }
      
      if (!executablePath) {
        throw new Error('Chrome executable not found. Please install Google Chrome or set PUPPETEER_EXECUTABLE_PATH environment variable.');
      }
      
      return {
        headless: 'new',
        executablePath,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      };
    }
  }

  /**
   * Generate PDF from data and template
   * @param {string} templateType - Type of template (sop-document, audit-report, executive-summary)
   * @param {Object} data - Data to fill template
   * @param {Object} options - PDF generation options
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDF(templateType, data, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Generating professional PDF: ${templateType}`);
      
      // Load and compile template
      const template = await this.getTemplate(templateType);
      
      // Prepare template data
      const templateData = this.prepareTemplateData(data, options);
      
      // Render HTML
      const html = template(templateData);
      
      // Generate PDF using Puppeteer
      const pdfBuffer = await this.htmlToPDF(html, options);
      
      // Update statistics
      const generationTime = Date.now() - startTime;
      this.updateStats(templateType, generationTime, true);
      
      console.log(`✅ PDF generated successfully: ${pdfBuffer.length} bytes in ${generationTime}ms`);
      
      return pdfBuffer;
      
    } catch (error) {
      const generationTime = Date.now() - startTime;
      this.updateStats(templateType, generationTime, false);
      
      console.error(`❌ PDF generation failed for ${templateType}:`, error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Convert HTML to PDF using Puppeteer
   * @private
   */
  async htmlToPDF(html, options = {}) {
    let browser = null;
    
    try {
      // Get Puppeteer options for this environment
      const puppeteerOptions = await this.getPuppeteerOptions();
      
      // Launch browser
      browser = await puppeteer.launch(puppeteerOptions);
      const page = await browser.newPage();
      
      // Set page content
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Configure PDF options
      const pdfOptions = {
        format: options.page?.format || 'A4',
        orientation: options.page?.orientation || 'portrait',
        margin: {
          top: '0.5in',
          right: '0.75in',
          bottom: '0.5in',
          left: '0.75in',
          ...options.page?.margins
        },
        printBackground: true,
        displayHeaderFooter: false, // We handle headers/footers in HTML
        preferCSSPageSize: true
      };
      
      // Generate PDF
      console.log(`📄 Converting HTML to PDF with options:`, pdfOptions);
      const pdfBuffer = await page.pdf(pdfOptions);
      
      return pdfBuffer;
      
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Load and compile Handlebars template
   * @private
   */
  async getTemplate(templateType) {
    // Check cache first
    if (this.templateCache.has(templateType)) {
      return this.templateCache.get(templateType);
    }
    
    try {
      const templatePath = path.join(this.templatesDir, `${templateType}.html`);
      const templateSource = await fs.readFile(templatePath, 'utf-8');
      const compiledTemplate = Handlebars.compile(templateSource);
      
      // Cache the compiled template
      this.templateCache.set(templateType, compiledTemplate);
      
      console.log(`📋 Template loaded and cached: ${templateType}`);
      return compiledTemplate;
      
    } catch (error) {
      console.error(`❌ Failed to load template ${templateType}:`, error);
      throw new Error(`Template not found: ${templateType}`);
    }
  }

  /**
   * Prepare data for template rendering
   * @private
   */
  prepareTemplateData(data, options) {
    const now = new Date();
    
    // Base template data
    const templateData = {
      ...data,
      // Add computed fields
      reportDate: now.toLocaleDateString(),
      generatedDate: now.toLocaleDateString(),
      effectiveDate: data.metadata?.effectiveDate ? 
        new Date(data.metadata.effectiveDate).toLocaleDateString() : 
        now.toLocaleDateString(),
      reviewDate: data.metadata?.reviewDate ? 
        new Date(data.metadata.reviewDate).toLocaleDateString() : 
        new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      approverDate: data.metadata?.approver?.date ? 
        new Date(data.metadata.approver.date).toLocaleDateString() : 
        now.toLocaleDateString(),
      
      // Branding defaults
      branding: {
        companyName: 'ProcessAudit AI',
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        logo: null,
        stamp: null,
        ...options.branding
      },
      
      // Metadata defaults
      metadata: {
        title: 'Business Process Document',
        author: 'ProcessAudit AI',
        classification: 'internal',
        ...data.metadata
      }
    };
    
    return templateData;
  }

  /**
   * Register Handlebars helpers for template rendering
   * @private
   */
  registerHandlebarsHelpers() {
    // Equality helper
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    // Join array helper
    Handlebars.registerHelper('join', function(array, separator) {
      if (!Array.isArray(array)) return '';
      return array.join(separator || ', ');
    });
    
    // Date formatting helper
    Handlebars.registerHelper('formatDate', function(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    });
    
    // Number formatting helper
    Handlebars.registerHelper('formatNumber', function(number) {
      if (typeof number !== 'number') return number;
      return number.toLocaleString();
    });
    
    // Priority class helper
    Handlebars.registerHelper('priorityClass', function(priority) {
      if (typeof priority === 'string') {
        return priority.toLowerCase();
      }
      if (typeof priority === 'number') {
        if (priority >= 80) return 'high';
        if (priority >= 60) return 'medium';
        return 'low';
      }
      return 'medium';
    });
    
    // Conditional block helper
    Handlebars.registerHelper('if', function(conditional, options) {
      if (conditional) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
    
    // Each helper (should already exist but ensure it's available)
    if (!Handlebars.helpers.each) {
      Handlebars.registerHelper('each', function(context, options) {
        let ret = "";
        if (context && typeof context === 'object' && context.length > 0) {
          for (let i = 0; i < context.length; i++) {
            ret += options.fn(context[i]);
          }
        }
        return ret;
      });
    }
  }

  /**
   * Get available template types
   * @returns {Array<string>} Available template types
   */
  getAvailableTemplates() {
    return ['sop-document', 'audit-report', 'executive-summary'];
  }

  /**
   * Validate template data
   * @param {string} templateType - Template type
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  validateTemplateData(templateType, data) {
    const errors = [];
    
    if (!data) {
      errors.push('Template data is required');
      return { valid: false, errors };
    }
    
    switch (templateType) {
      case 'sop-document':
        if (!data.metadata?.title) errors.push('SOP title is required');
        if (!data.purpose) errors.push('SOP purpose is required');
        if (!data.scope) errors.push('SOP scope is required');
        if (!data.procedures || !Array.isArray(data.procedures)) {
          errors.push('SOP procedures array is required');
        }
        break;
        
      case 'audit-report':
        if (!data.reportData?.executiveSummary) {
          errors.push('Executive summary is required for audit reports');
        }
        if (!data.reportData?.automationOpportunities) {
          errors.push('Automation opportunities are required for audit reports');
        }
        break;
        
      case 'executive-summary':
        if (!data.reportData?.executiveSummary) {
          errors.push('Executive summary data is required');
        }
        break;
        
      default:
        errors.push(`Unsupported template type: ${templateType}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
    console.log('📋 Template cache cleared');
  }

  /**
   * Get generation statistics
   * @returns {Object} Generation statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset generation statistics
   */
  resetStats() {
    this.stats = {
      totalGenerated: 0,
      averageGenerationTime: 0,
      generationsByType: {},
      errors: 0
    };
  }

  /**
   * Update generation statistics
   * @private
   */
  updateStats(templateType, generationTime, success) {
    this.stats.totalGenerated++;
    
    if (success) {
      // Update average generation time
      const totalTime = this.stats.averageGenerationTime * (this.stats.totalGenerated - 1) + generationTime;
      this.stats.averageGenerationTime = totalTime / this.stats.totalGenerated;
      
      // Update by type
      if (!this.stats.generationsByType[templateType]) {
        this.stats.generationsByType[templateType] = {
          count: 0,
          averageTime: 0
        };
      }
      
      const typeStats = this.stats.generationsByType[templateType];
      const newCount = typeStats.count + 1;
      const totalTypeTime = typeStats.averageTime * typeStats.count + generationTime;
      
      typeStats.count = newCount;
      typeStats.averageTime = totalTypeTime / newCount;
      
    } else {
      this.stats.errors++;
    }
  }
}

module.exports = PuppeteerPDFGenerator;