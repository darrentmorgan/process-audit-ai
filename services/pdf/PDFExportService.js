/**
 * PDFExportService - ProcessAudit AI
 * 
 * Handles PDF export operations including download preparation,
 * email delivery, and file management
 */

const fs = require('fs').promises
const path = require('path')

/**
 * PDF Export Service
 * Manages PDF export operations and delivery methods
 */
class PDFExportService {
  constructor(options = {}) {
    this.tempDirectory = options.tempDirectory || '/tmp/processaudit-pdf'
    this.maxFileAge = options.maxFileAge || 3600000 // 1 hour in milliseconds
    this.emailService = options.emailService || null
    
    // Export statistics
    this.stats = {
      totalExports: 0,
      exportsByMethod: {
        download: 0,
        email: 0,
        store: 0
      },
      totalFileSize: 0,
      averageFileSize: 0
    }
    
    // Initialize temp directory
    this._initializeTempDirectory()
  }

  /**
   * Prepare PDF for download
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} filename - Desired filename
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Download preparation result
   */
  async prepareDownload(pdfBuffer, filename, options = {}) {
    try {
      // Validate filename
      const sanitizedFilename = this._sanitizeFilename(filename)
      
      // Generate unique file ID for temporary storage
      const fileId = this._generateFileId()
      const tempFilePath = path.join(this.tempDirectory, `${fileId}-${sanitizedFilename}`)
      
      // Save to temporary location
      await fs.writeFile(tempFilePath, pdfBuffer)
      
      // Schedule cleanup
      this._scheduleCleanup(tempFilePath)
      
      // Update statistics
      this._updateStats('download', pdfBuffer.length)
      
      return {
        success: true,
        fileId,
        filename: sanitizedFilename,
        filePath: tempFilePath,
        fileSize: pdfBuffer.length,
        downloadUrl: `/api/pdf-download/${fileId}`, // API endpoint for download
        expiresAt: new Date(Date.now() + this.maxFileAge)
      }
      
    } catch (error) {
      console.error('PDF download preparation failed:', error)
      
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Send PDF via email
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} filename - PDF filename
   * @param {Object} emailOptions - Email configuration
   * @returns {Promise<Object>} Email sending result
   */
  async sendEmail(pdfBuffer, filename, emailOptions) {
    try {
      if (!this.emailService) {
        throw new Error('Email service not configured')
      }
      
      if (!emailOptions.to || !emailOptions.subject) {
        throw new Error('Email recipient and subject are required')
      }
      
      // Prepare email with PDF attachment
      const emailData = {
        to: emailOptions.to,
        from: emailOptions.from || 'noreply@processaudit.ai',
        subject: emailOptions.subject,
        html: this._generateEmailTemplate(emailOptions),
        attachments: [
          {
            filename: this._sanitizeFilename(filename),
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      }
      
      // Send email
      const result = await this.emailService.send(emailData)
      
      // Update statistics
      this._updateStats('email', pdfBuffer.length)
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: emailOptions.to,
        subject: emailOptions.subject,
        sentAt: new Date()
      }
      
    } catch (error) {
      console.error('PDF email sending failed:', error)
      
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Store PDF in permanent location (S3, database, etc.)
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} filename - PDF filename
   * @param {Object} storageOptions - Storage configuration
   * @returns {Promise<Object>} Storage result
   */
  async storePDF(pdfBuffer, filename, storageOptions = {}) {
    try {
      // File-based temporary storage implementation
      // For production: integrate with cloud storage (S3, etc.)
      
      const sanitizedFilename = this._sanitizeFilename(filename)
      const storageKey = `${Date.now()}-${sanitizedFilename}`
      
      // For now, just store in temp directory with longer retention
      const storagePath = path.join(this.tempDirectory, 'permanent', storageKey)
      
      // Ensure permanent directory exists
      await fs.mkdir(path.dirname(storagePath), { recursive: true })
      
      // Write file
      await fs.writeFile(storagePath, pdfBuffer)
      
      // Update statistics
      this._updateStats('store', pdfBuffer.length)
      
      return {
        success: true,
        storageKey,
        storagePath,
        fileSize: pdfBuffer.length,
        storedAt: new Date()
      }
      
    } catch (error) {
      console.error('PDF storage failed:', error)
      
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get PDF file by ID (for download endpoint)
   * @param {string} fileId - File identifier
   * @returns {Promise<Object>} File data or error
   */
  async getFileById(fileId) {
    try {
      // Find file in temp directory
      const files = await fs.readdir(this.tempDirectory)
      const matchingFile = files.find(file => file.startsWith(fileId))
      
      if (!matchingFile) {
        return {
          success: false,
          error: 'File not found or expired'
        }
      }
      
      const filePath = path.join(this.tempDirectory, matchingFile)
      const fileBuffer = await fs.readFile(filePath)
      const filename = matchingFile.substring(matchingFile.indexOf('-') + 1)
      
      return {
        success: true,
        buffer: fileBuffer,
        filename,
        filePath
      }
      
    } catch (error) {
      console.error('File retrieval failed:', error)
      
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Clean up expired files
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupExpiredFiles() {
    try {
      const files = await fs.readdir(this.tempDirectory)
      const now = Date.now()
      let cleanedCount = 0
      let cleanedSize = 0
      
      for (const file of files) {
        const filePath = path.join(this.tempDirectory, file)
        const stats = await fs.stat(filePath)
        
        if (now - stats.mtime.getTime() > this.maxFileAge) {
          cleanedSize += stats.size
          await fs.unlink(filePath)
          cleanedCount++
        }
      }
      
      return {
        success: true,
        cleanedCount,
        cleanedSize,
        cleanedAt: new Date()
      }
      
    } catch (error) {
      console.error('File cleanup failed:', error)
      
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get export statistics
   * @returns {Object} Export statistics
   */
  getStats() {
    return { ...this.stats }
  }

  /**
   * Reset export statistics
   */
  resetStats() {
    this.stats = {
      totalExports: 0,
      exportsByMethod: {
        download: 0,
        email: 0,
        store: 0
      },
      totalFileSize: 0,
      averageFileSize: 0
    }
  }

  // Private methods

  /**
   * Initialize temporary directory
   * @private
   */
  async _initializeTempDirectory() {
    try {
      await fs.mkdir(this.tempDirectory, { recursive: true })
      await fs.mkdir(path.join(this.tempDirectory, 'permanent'), { recursive: true })
    } catch (error) {
      console.error('Failed to initialize temp directory:', error)
    }
  }

  /**
   * Generate unique file ID
   * @private
   */
  _generateFileId() {
    return `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * Sanitize filename for safe file system usage
   * @private
   */
  _sanitizeFilename(filename) {
    // Remove or replace dangerous characters
    return filename
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100) // Limit length
  }

  /**
   * Schedule file cleanup
   * @private
   */
  _scheduleCleanup(filePath) {
    setTimeout(async () => {
      try {
        await fs.unlink(filePath)
      } catch (error) {
        // File might already be deleted, ignore error
      }
    }, this.maxFileAge)
  }

  /**
   * Update export statistics
   * @private
   */
  _updateStats(method, fileSize) {
    this.stats.totalExports++
    this.stats.exportsByMethod[method]++
    this.stats.totalFileSize += fileSize
    this.stats.averageFileSize = this.stats.totalFileSize / this.stats.totalExports
  }

  /**
   * Generate HTML email template
   * @private
   */
  _generateEmailTemplate(emailOptions) {
    const { organizationName = 'ProcessAudit AI', documentType = 'report' } = emailOptions
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your ${documentType} is ready</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f8fafc;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Your ${documentType} is ready!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your ${documentType} from ${organizationName} has been generated and is attached to this email.</p>
          <p>The document contains your business process analysis and recommendations for automation opportunities.</p>
          <p>If you have any questions about the report or need assistance implementing the recommendations, please don't hesitate to reach out.</p>
          <p>Best regards,<br>The ProcessAudit AI Team</p>
        </div>
        <div class="footer">
          <p>This email was sent by ProcessAudit AI - AI-Powered Business Process Analysis</p>
        </div>
      </body>
      </html>
    `
  }
}

module.exports = PDFExportService