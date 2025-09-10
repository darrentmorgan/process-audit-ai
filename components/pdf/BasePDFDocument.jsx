/**
 * BasePDFDocument Component - ProcessAudit AI
 * 
 * Foundation component for all PDF documents using @react-pdf/renderer
 * Provides common structure, styling, and branding
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font
} from '@react-pdf/renderer'

// Register fonts (placeholder - would load actual font files)
// Font.register({
//   family: 'Helvetica',
//   src: '/fonts/Helvetica.ttf'
// })

/**
 * Base PDF styles following ProcessAudit AI design system
 */
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    color: '#2c3e50',
    backgroundColor: '#ffffff'
  },
  
  // Header styles
  header: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottom: '1pt solid #ecf0f1'
  },
  
  headerLogo: {
    width: 120,
    height: 40
  },
  
  headerText: {
    fontSize: 10,
    color: '#7f8c8d'
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTop: '1pt solid #ecf0f1'
  },
  
  footerText: {
    fontSize: 9,
    color: '#7f8c8d'
  },
  
  // Typography styles
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center'
  },
  
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 12,
    borderBottom: '2pt solid #2563eb',
    paddingBottom: 4
  },
  
  heading2: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginTop: 16,
    marginBottom: 10
  },
  
  heading3: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495e',
    marginTop: 12,
    marginBottom: 8
  },
  
  body: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 8,
    textAlign: 'justify'
  },
  
  small: {
    fontSize: 10,
    color: '#7f8c8d',
    lineHeight: 1.4
  },
  
  // Layout styles
  section: {
    marginBottom: 20
  },
  
  row: {
    flexDirection: 'row',
    marginBottom: 8
  },
  
  column: {
    flex: 1,
    paddingRight: 10
  },
  
  // Card-like containers
  card: {
    backgroundColor: '#f8fafc',
    border: '1pt solid #e2e8f0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12
  },
  
  // Status and priority indicators
  statusBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    fontSize: 9,
    textAlign: 'center',
    color: '#475569'
  },
  
  priorityHigh: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1pt solid #fecaca'
  },
  
  priorityMedium: {
    backgroundColor: '#fffbeb',
    color: '#d97706',
    border: '1pt solid #fed7aa'
  },
  
  priorityLow: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    border: '1pt solid #bbf7d0'
  },
  
  // Lists
  list: {
    marginLeft: 15,
    marginBottom: 8
  },
  
  listItem: {
    flexDirection: 'row',
    marginBottom: 4
  },
  
  listBullet: {
    width: 15,
    fontSize: 12
  },
  
  listText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 1.4
  },
  
  // Tables
  table: {
    display: 'table',
    width: '100%',
    marginBottom: 12,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold'
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    minHeight: 25,
    alignItems: 'center'
  },
  
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    borderRightStyle: 'solid'
  },
  
  // Utility classes
  textCenter: {
    textAlign: 'center'
  },
  
  textRight: {
    textAlign: 'right'
  },
  
  textBold: {
    fontWeight: 'bold'
  },
  
  marginTop: {
    marginTop: 12
  },
  
  marginBottom: {
    marginBottom: 12
  },
  
  pageBreak: {
    pageBreakBefore: true
  }
})

/**
 * Base PDF Document Component
 * Provides common structure and styling for all PDF documents
 */
const BasePDFDocument = ({ 
  title,
  metadata = {},
  branding = {},
  children,
  showHeader = true,
  showFooter = true,
  pageNumbers = true
}) => {
  const documentTitle = title || metadata.title || 'ProcessAudit AI Document'
  const companyName = branding.companyName || 'ProcessAudit AI'
  
  return (
    <Document
      title={documentTitle}
      author={metadata.author || companyName}
      subject={metadata.subject || 'Business Process Analysis'}
      keywords={metadata.keywords?.join(', ') || 'ProcessAudit AI, Business Process, Analysis'}
      creator={companyName}
      producer={companyName}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {showHeader && (
          <View style={styles.header} fixed>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {branding.logo && (
                <Image src={branding.logo} style={styles.headerLogo} alt="Company Logo" />
              )}
              {!branding.logo && (
                <Text style={[styles.headerText, { fontWeight: 'bold', fontSize: 12 }]}>
                  {companyName}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.headerText}>
                {new Date().toLocaleDateString()}
              </Text>
              <Text style={styles.headerText}>
                {documentTitle}
              </Text>
            </View>
          </View>
        )}
        
        {/* Main Content */}
        <View style={{ flex: 1 }}>
          {children}
        </View>
        
        {/* Footer */}
        {showFooter && (
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>
              Generated by {companyName}
            </Text>
            {pageNumbers && (
              <Text style={styles.footerText} render={({ pageNumber, totalPages }) => 
                `Page ${pageNumber} of ${totalPages}`
              } />
            )}
          </View>
        )}
      </Page>
    </Document>
  )
}

/**
 * Helper Components for common PDF elements
 */

export const PDFTitle = ({ children, style = {} }) => (
  <Text style={[styles.title, style]}>{children}</Text>
)

export const PDFHeading1 = ({ children, style = {} }) => (
  <Text style={[styles.heading1, style]}>{children}</Text>
)

export const PDFHeading2 = ({ children, style = {} }) => (
  <Text style={[styles.heading2, style]}>{children}</Text>
)

export const PDFHeading3 = ({ children, style = {} }) => (
  <Text style={[styles.heading3, style]}>{children}</Text>
)

export const PDFText = ({ children, style = {}, small = false }) => (
  <Text style={[small ? styles.small : styles.body, style]}>{children}</Text>
)

export const PDFSection = ({ children, style = {} }) => (
  <View style={[styles.section, style]}>{children}</View>
)

export const PDFCard = ({ children, style = {} }) => (
  <View style={[styles.card, style]}>{children}</View>
)

export const PDFRow = ({ children, style = {} }) => (
  <View style={[styles.row, style]}>{children}</View>
)

export const PDFColumn = ({ children, style = {} }) => (
  <View style={[styles.column, style]}>{children}</View>
)

export const PDFList = ({ items = [], style = {} }) => (
  <View style={[styles.list, style]}>
    {items.map((item, index) => (
      <View key={index} style={styles.listItem}>
        <Text style={styles.listBullet}>•</Text>
        <Text style={styles.listText}>{item}</Text>
      </View>
    ))}
  </View>
)

export const PDFTable = ({ headers = [], rows = [], style = {} }) => (
  <View style={[styles.table, style]}>
    {/* Header */}
    {headers.length > 0 && (
      <View style={[styles.tableRow, styles.tableHeader]}>
        {headers.map((header, index) => (
          <Text key={index} style={styles.tableCell}>
            {header}
          </Text>
        ))}
      </View>
    )}
    
    {/* Rows */}
    {rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.tableRow}>
        {row.map((cell, cellIndex) => (
          <Text key={cellIndex} style={styles.tableCell}>
            {cell}
          </Text>
        ))}
      </View>
    ))}
  </View>
)

export const PDFStatusBadge = ({ status, priority = 'medium', style = {} }) => {
  const priorityStyles = {
    high: styles.priorityHigh,
    medium: styles.priorityMedium,
    low: styles.priorityLow
  }
  
  return (
    <Text style={[styles.statusBadge, priorityStyles[priority], style]}>
      {status}
    </Text>
  )
}

// Export styles for custom components
export const pdfStyles = styles

export default BasePDFDocument