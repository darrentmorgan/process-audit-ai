import { useState } from 'react'
import { Trash2, Search, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuditReports } from '../hooks/useSupabase'
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'

const DatabaseCleanup = ({ isOpen, onClose }) => {
  const { reports, deleteReport, loadReports } = useAuditReports()
  const { user } = useUnifiedAuth()
  const [duplicates, setDuplicates] = useState([])
  const [scanning, setScanning] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [cleanupResults, setCleanupResults] = useState(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  // Helper function to create a content hash for comparison
  const createContentHash = (report) => {
    return JSON.stringify({
      process_description: report.process_description,
      file_content: report.file_content || '',
      answers: JSON.stringify(report.answers || {})
    })
  }

  // Helper function to check if timestamps are close (within minutes)
  const areTimestampsClose = (timestamp1, timestamp2, minutesTolerance = 10) => {
    const time1 = new Date(timestamp1).getTime()
    const time2 = new Date(timestamp2).getTime()
    const diffMinutes = Math.abs(time1 - time2) / (1000 * 60)
    return diffMinutes <= minutesTolerance
  }

  const scanForDuplicates = async () => {
    setScanning(true)
    try {
      await loadReports() // Ensure we have latest data
      
      const duplicateGroups = []
      const processedReports = new Set()

      for (let i = 0; i < reports.length; i++) {
        if (processedReports.has(reports[i].id)) continue

        const currentReport = reports[i]
        const currentHash = createContentHash(currentReport)
        const duplicatesGroup = [currentReport]

        // Find similar reports
        for (let j = i + 1; j < reports.length; j++) {
          const compareReport = reports[j]
          
          if (processedReports.has(compareReport.id)) continue
          
          const compareHash = createContentHash(compareReport)
          const isContentSimilar = currentHash === compareHash
          const isTimestampClose = areTimestampsClose(
            currentReport.created_at,
            compareReport.created_at,
            15 // 15 minute tolerance
          )

          if (isContentSimilar && isTimestampClose) {
            duplicatesGroup.push(compareReport)
            processedReports.add(compareReport.id)
          }
        }

        if (duplicatesGroup.length > 1) {
          // Sort by creation date (newest first)
          duplicatesGroup.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          duplicateGroups.push(duplicatesGroup)
        }

        processedReports.add(currentReport.id)
      }

      setDuplicates(duplicateGroups)
    } catch (error) {
      console.error('Error scanning for duplicates:', error)
    } finally {
      setScanning(false)
    }
  }

  const cleanupDuplicates = async () => {
    setCleaning(true)
    const results = { deleted: 0, failed: 0, kept: 0 }

    try {
      // Collect all IDs to delete in one batch
      const idsToDelete = []
      
      for (const group of duplicates) {
        const [keepReport, ...deleteReports] = group // Keep first (newest), delete rest
        results.kept++
        
        // Add all duplicate IDs to the batch
        deleteReports.forEach(report => {
          idsToDelete.push(report.id)
        })
      }

      console.log(`🗑️ Starting batch deletion of ${idsToDelete.length} reports...`)
      setProgress({ current: 0, total: idsToDelete.length })

      // Process deletions in batches of 10 for better performance
      const batchSize = 10
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize)
        
        // Process batch in parallel
        const deletePromises = batch.map(async (reportId) => {
          try {
            const { error } = await deleteReport(reportId)
            if (error) {
              console.error(`Failed to delete ${reportId}:`, error)
              return { success: false, id: reportId }
            } else {
              return { success: true, id: reportId }
            }
          } catch (error) {
            console.error(`Error deleting ${reportId}:`, error)
            return { success: false, id: reportId }
          }
        })

        // Wait for current batch to complete
        const batchResults = await Promise.all(deletePromises)
        
        // Update results and progress
        batchResults.forEach(result => {
          if (result.success) {
            results.deleted++
          } else {
            results.failed++
          }
        })

        // Update progress
        setProgress({ current: Math.min(i + batchSize, idsToDelete.length), total: idsToDelete.length })

        // Brief pause between batches to avoid overwhelming the API
        if (i + batchSize < idsToDelete.length) {
          await new Promise(resolve => setTimeout(resolve, 50)) // Reduced pause for faster processing
        }
      }

      console.log(`✅ Batch deletion complete: ${results.deleted} deleted, ${results.failed} failed`)
      setCleanupResults(results)
      setDuplicates([]) // Clear duplicates after cleanup
      
      // Refresh the reports list to show updated count
      await loadReports()
      
    } catch (error) {
      console.error('Error during cleanup:', error)
    } finally {
      setCleaning(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Database Cleanup</h2>
            <p className="text-gray-600 mt-1">Remove duplicate reports from your account</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
