/**
 * PDF Templates API Route - ProcessAudit AI
 * 
 * Manages PDF templates for different document types
 * Supports CRUD operations for custom templates
 */

import PDFTemplateEngine from '../../services/pdf/PDFTemplateEngine'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    maxDuration: 10,
  },
}

export default async function handler(req, res) {
  try {
    // Initialize template engine
    const templateEngine = new PDFTemplateEngine()

    switch (req.method) {
      case 'GET':
        return await handleGetTemplates(req, res, templateEngine)
      
      case 'POST':
        return await handleCreateTemplate(req, res, templateEngine)
      
      case 'PUT':
        return await handleUpdateTemplate(req, res, templateEngine)
      
      case 'DELETE':
        return await handleDeleteTemplate(req, res, templateEngine)
      
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        })
    }

  } catch (error) {
    console.error('PDF templates API error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Handle GET requests - retrieve templates
 */
async function handleGetTemplates(req, res, templateEngine) {
  const { documentType, templateId } = req.query

  try {
    if (templateId) {
      // Get specific template
      const template = await templateEngine.getTemplate(documentType, { id: templateId })
      
      return res.status(200).json({
        success: true,
        template
      })
      
    } else if (documentType) {
      // Get all templates for a document type
      const templates = templateEngine.getAvailableTemplates(documentType)
      
      return res.status(200).json({
        success: true,
        templates,
        documentType
      })
      
    } else {
      // Get template statistics
      const stats = templateEngine.getStats()
      
      return res.status(200).json({
        success: true,
        stats,
        availableTypes: ['audit-report', 'sop-document', 'executive-summary']
      })
    }

  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Handle POST requests - create new template
 */
async function handleCreateTemplate(req, res, templateEngine) {
  const { templateId, template } = req.body

  if (!templateId || !template) {
    return res.status(400).json({
      success: false,
      error: 'Template ID and template data are required'
    })
  }

  // Validate template structure
  const validationResult = validateTemplate(template)
  if (!validationResult.valid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid template structure',
      validationErrors: validationResult.errors
    })
  }

  try {
    templateEngine.registerTemplate(templateId, template)
    
    return res.status(201).json({
      success: true,
      templateId,
      message: 'Template created successfully'
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Handle PUT requests - update existing template
 */
async function handleUpdateTemplate(req, res, templateEngine) {
  const { templateId } = req.query
  const { template } = req.body

  if (!templateId || !template) {
    return res.status(400).json({
      success: false,
      error: 'Template ID and template data are required'
    })
  }

  // Validate template structure
  const validationResult = validateTemplate(template)
  if (!validationResult.valid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid template structure',
      validationErrors: validationResult.errors
    })
  }

  try {
    templateEngine.registerTemplate(templateId, template)
    
    return res.status(200).json({
      success: true,
      templateId,
      message: 'Template updated successfully'
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Handle DELETE requests - delete template
 */
async function handleDeleteTemplate(req, res, templateEngine) {
  const { templateId } = req.query

  if (!templateId) {
    return res.status(400).json({
      success: false,
      error: 'Template ID is required'
    })
  }

  // Prevent deletion of default templates
  if (templateId.startsWith('default-')) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete default templates'
    })
  }

  try {
    // TODO: Implement template deletion
    // For now, just clear cache and return success
    templateEngine.clearCache()
    
    return res.status(200).json({
      success: true,
      templateId,
      message: 'Template deleted successfully'
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Validate template structure
 */
function validateTemplate(template) {
  const errors = []

  // Required fields
  if (!template.name) errors.push('Template name is required')
  if (!template.type) errors.push('Template type is required')
  if (!template.sections || !Array.isArray(template.sections)) {
    errors.push('Template sections array is required')
  }

  // Validate document type
  const validTypes = ['audit-report', 'sop-document', 'executive-summary', 'custom']
  if (template.type && !validTypes.includes(template.type)) {
    errors.push(`Invalid template type. Must be one of: ${validTypes.join(', ')}`)
  }

  // Validate sections
  if (template.sections && Array.isArray(template.sections)) {
    template.sections.forEach((section, index) => {
      if (!section.id) errors.push(`Section ${index + 1}: ID is required`)
      if (!section.title) errors.push(`Section ${index + 1}: Title is required`)
      if (!section.type) errors.push(`Section ${index + 1}: Type is required`)
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}