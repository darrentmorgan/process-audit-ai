/**
 * PDF Generation API v2 - ProcessAudit AI
 * 
 * Professional PDF generation using Puppeteer + HTML templates
 * Generates high-quality business documents instead of problematic React-PDF output
 */

import PuppeteerPDFGenerator from '../../services/pdf/PuppeteerPDFGenerator'

// Configure API route for professional PDF generation
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '50mb',
    maxDuration: 60, // 60 seconds for professional document generation
  },
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    })
  }

  try {
    console.log('🚀 PDF Generation v2 API - Using Puppeteer + HTML templates');
    
    // Initialize Puppeteer PDF generator
    const pdfGenerator = new PuppeteerPDFGenerator({
      templatesDir: process.env.TEMPLATES_DIR || undefined // Use default
    });

    // Validate request body
    const { documentType, reportData, sopData, processData, options } = req.body;
    
    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      });
    }

    if (!options) {
      return res.status(400).json({
        success: false,
        error: 'PDF options are required'
      });
    }

    // Validate document type
    const validTypes = ['audit-report', 'sop-document', 'executive-summary'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid document type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    console.log(`📊 Generating ${documentType} PDF for professional business use`);

    // Prepare data based on document type
    let templateData;
    
    switch (documentType) {
      case 'sop-document':
        templateData = sopData || convertReportDataToSOP(reportData, processData);
        break;
        
      case 'audit-report':
        templateData = {
          reportData: reportData || {},
          processData: processData || {},
          metadata: {
            title: processData?.processName ? 
              `Business Process Audit Report: ${processData.processName}` : 
              'Business Process Audit Report',
            author: options.metadata?.author || 'ProcessAudit AI',
            ...options.metadata
          }
        };
        break;
        
      case 'executive-summary':
        templateData = {
          reportData: reportData || {},
          processData: processData || {},
          metadata: {
            title: processData?.processName ? 
              `Executive Summary: ${processData.processName}` : 
              'Executive Summary - Process Analysis',
            author: options.metadata?.author || 'ProcessAudit AI',
            ...options.metadata
          }
        };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported document type: ${documentType}`
        });
    }

    // Validate template data
    const validation = pdfGenerator.validateTemplateData(documentType, templateData);
    if (!validation.valid) {
      console.error('❌ Template data validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Invalid template data',
        details: validation.errors
      });
    }

    // Generate professional PDF
    const startTime = Date.now();
    const pdfBuffer = await pdfGenerator.generatePDF(
      documentType, 
      templateData, 
      {
        page: {
          format: options.page?.format || 'A4',
          orientation: options.page?.orientation || 'portrait',
          margins: options.page?.margins
        },
        branding: options.branding,
        ...options.options
      }
    );
    const generationTime = Date.now() - startTime;

    console.log(`✅ Professional PDF generated: ${pdfBuffer.length} bytes in ${generationTime}ms`);

    // Handle delivery method
    const deliveryMethod = req.query.delivery || 'download';

    switch (deliveryMethod) {
      case 'download':
        // Return PDF directly for download
        const filename = options.filename || `${documentType}-${Date.now()}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        
        // Ensure binary response (not JSON)
        res.writeHead(200);
        res.end(pdfBuffer);
        return;

      case 'link':
        // TODO: Implement download link generation
        return res.status(501).json({
          success: false,
          error: 'Link delivery method not yet implemented'
        });

      case 'email':
        // TODO: Implement email delivery
        return res.status(501).json({
          success: false,
          error: 'Email delivery method not yet implemented'
        });

      default:
        return res.status(400).json({
          success: false,
          error: `Invalid delivery method: ${deliveryMethod}`
        });
    }

  } catch (error) {
    console.error('❌ PDF Generation v2 API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during professional PDF generation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Convert report data to SOP format for PDF generation
 */
function convertReportDataToSOP(reportData, processData) {
  if (!reportData && !processData) {
    throw new Error('Either reportData or processData is required for SOP generation');
  }

  // Convert automation opportunities to SOP procedures
  const procedures = [];
  
  if (reportData?.automationOpportunities && reportData.automationOpportunities.length > 0) {
    procedures.push({
      name: 'Process Automation Procedures',
      steps: reportData.automationOpportunities.map((opportunity, index) => ({
        stepNumber: index + 1,
        title: opportunity.title || opportunity.stepDescription || `Automation Step ${index + 1}`,
        description: opportunity.solution || opportunity.description || '',
        instructions: opportunity.implementationSteps || opportunity.steps || [],
        expectedOutcome: `Successful implementation of ${opportunity.title || 'automation opportunity'}`,
        timeEstimate: opportunity.estimatedTime || 30,
        resources: opportunity.tools || [],
        qualityChecks: [`Verify ${opportunity.title || 'automation'} is working correctly`]
      }))
    });
  }

  return {
    metadata: {
      title: processData?.processName ? `SOP: ${processData.processName}` : 'Standard Operating Procedure',
      sopVersion: '1.0',
      effectiveDate: new Date(),
      approvalStatus: 'draft',
      documentId: 'SOP-AUTO-001',
      department: processData?.department || 'Operations',
      processOwner: processData?.processOwner || 'Process Owner',
      classification: 'internal',
      author: 'ProcessAudit AI'
    },
    purpose: reportData?.executiveSummary?.overview || 
             'This Standard Operating Procedure documents the optimized business process based on AI analysis findings.',
    scope: 'This procedure applies to all personnel involved in the analyzed business process.',
    responsibilities: [
      {
        role: 'Process Owner',
        description: 'Responsible for overall process governance and continuous improvement'
      },
      {
        role: 'Process Participants',
        description: 'Execute process steps according to this SOP and report any deviations'
      },
      {
        role: 'Quality Assurance',
        description: 'Monitor process performance and ensure compliance with documented procedures'
      }
    ],
    procedures,
    relatedDocuments: [
      {
        title: 'Business Process Analysis Report',
        reference: 'Generated by ProcessAudit AI',
        type: 'external'
      }
    ],
    revisionHistory: [
      {
        version: '1.0',
        date: new Date().toLocaleDateString(),
        author: 'ProcessAudit AI',
        changes: 'Initial version generated from process analysis and optimization'
      }
    ]
  };
}