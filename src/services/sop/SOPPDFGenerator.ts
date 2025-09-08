import puppeteer from 'puppeteer'
import { 
  SOPDocument, 
  OrganizationBranding, 
  SOPPDFGenerationRequest, 
  SOPPDFGenerationResponse 
} from '@/types/sop'
import { SOPFormatter } from './SOPFormatter'
import { uploadToCloudStorage } from '@/utils/cloudStorage'
import { generateTrackingId } from '@/utils/trackingUtils'

export class SOPPDFGenerator {
  private static async createBrandedTemplate(
    sopDocument: SOPDocument, 
    branding: OrganizationBranding
  ): string {
    const formattedContent = SOPFormatter.formatSOP(
      sopDocument, 
      'step-by-step' // Default format, can be dynamic
    )

    // Generate branded HTML template
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${sopDocument.header.title}</title>
        <style>
          :root {
            --primary-color: ${branding.primaryColor};
            --secondary-color: ${branding.secondaryColor};
            --font-family: ${branding.fontFamily || 'Arial, sans-serif'};
          }

          body {
            font-family: var(--font-family);
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }

          .sop-header {
            background-color: var(--primary-color);
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
          }

          .sop-logo {
            max-width: 200px;
            margin-bottom: 15px;
          }

          .sop-metadata {
            background-color: #f4f4f4;
            padding: 15px;
            margin-bottom: 20px;
            border-left: 5px solid var(--secondary-color);
          }

          .sop-procedures {
            counter-reset: step-counter;
          }

          .sop-procedure {
            position: relative;
            padding-left: 40px;
            margin-bottom: 15px;
          }

          .sop-procedure::before {
            content: counter(step-counter);
            counter-increment: step-counter;
            position: absolute;
            left: 0;
            top: 0;
            background-color: var(--primary-color);
            color: white;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }
        </style>
      </head>
      <body>
        <div class="sop-header">
          ${branding.logoUrl 
            ? `<img src="${branding.logoUrl}" alt="${branding.name} Logo" class="sop-logo">` 
            : ''}
          <h1>${sopDocument.header.title}</h1>
        </div>

        <div class="sop-metadata">
          <p><strong>Document Number:</strong> ${sopDocument.header.documentNumber}</p>
          <p><strong>Version:</strong> ${sopDocument.header.version}</p>
          <p><strong>Effective Date:</strong> ${sopDocument.header.effectiveDate.toLocaleDateString()}</p>
          <p><strong>Approved By:</strong> ${sopDocument.header.approvedBy}</p>
        </div>

        <div class="sop-procedures">
          ${formattedContent
            .split('\n')
            .map(step => `<div class="sop-procedure">${step}</div>`)
            .join('')
          }
        </div>

        <footer>
          <p>© ${new Date().getFullYear()} ${branding.name} | Confidential</p>
        </footer>
      </body>
      </html>
    `
  }

  /**
   * Generate a branded, compliant SOP PDF
   * @param request SOP PDF generation request
   * @returns PDF generation response
   */
  public static async generatePDF(
    request: SOPPDFGenerationRequest
  ): Promise<SOPPDFGenerationResponse> {
    const startTime = Date.now()
    const trackingId = generateTrackingId()

    try {
      // Fetch SOP document from database or audit report
      const sopDocument = await this.fetchSOPDocument(request.reportId)

      // Validate compliance 
      const complianceCheck = SOPFormatter.validateCompliance(sopDocument)
      if (!complianceCheck.isCompliant) {
        console.warn('SOP does not fully comply with standards', complianceCheck.missingFields)
      }

      // Create branded HTML template
      const htmlTemplate = await this.createBrandedTemplate(
        sopDocument, 
        request.branding
      )

      // Launch Puppeteer and generate PDF
      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      
      // Set page content and PDF options
      await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' })
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
      })

      await browser.close()

      // Upload PDF to cloud storage
      const pdfUrl = await uploadToCloudStorage({
        buffer: pdfBuffer,
        filename: `sop-${trackingId}.pdf`,
        contentType: 'application/pdf'
      })

      const generationTime = Date.now() - startTime

      // Save PDF metadata to database
      await this.saveGeneratedSOPMetadata({
        reportId: request.reportId,
        pdfUrl,
        fileSize: pdfBuffer.length,
        generationTime,
        trackingId
      })

      return {
        success: true,
        pdfUrl,
        downloadToken: trackingId,
        metadata: {
          fileSize: pdfBuffer.length,
          generationTime
        }
      }
    } catch (error) {
      console.error('SOP PDF Generation Error', error)
      return {
        success: false,
        metadata: {
          fileSize: 0,
          generationTime: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Fetch SOP document from database or audit report
   * @param reportId Audit report identifier
   * @returns SOP document
   */
  private static async fetchSOPDocument(reportId: string): Promise<SOPDocument> {
    // Implement database fetching logic
    // This is a placeholder - replace with actual database query
    throw new Error('Not implemented')
  }

  /**
   * Save generated SOP PDF metadata to database
   * @param metadata PDF generation metadata
   */
  private static async saveGeneratedSOPMetadata(metadata: {
    reportId: string
    pdfUrl: string
    fileSize: number
    generationTime: number
    trackingId: string
  }): Promise<void> {
    // Implement database saving logic
    // This is a placeholder - replace with actual database query
    throw new Error('Not implemented')
  }
}