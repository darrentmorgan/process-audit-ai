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
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Scan Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 1: Scan for Duplicates</h3>
                <p className="text-sm text-gray-600">Find reports with identical content created within 15 minutes</p>
              </div>
              <button
                onClick={scanForDuplicates}
                disabled={scanning}
                className="btn-primary flex items-center gap-2"
              >
                {scanning ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {scanning ? 'Scanning...' : 'Scan for Duplicates'}
              </button>
            </div>

            {/* Scan Results */}
            {duplicates.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">
                    Found {duplicates.length} duplicate groups affecting {duplicates.reduce((sum, group) => sum + group.length, 0)} reports
                  </span>
                </div>

                {duplicates.map((group, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Group {index + 1}: &quot;{group[0].title}&quot;
                    </h4>
                    <div className="space-y-2 ml-4">
                      {group.map((report, reportIndex) => (
                        <div key={report.id} className="flex items-center justify-between text-sm">
                          <span className={reportIndex === 0 ? 'text-green-700 font-medium' : 'text-red-700'}>
                            {reportIndex === 0 ? '✅ KEEP' : '🗑️ DELETE'}: {formatDate(report.created_at)}
                          </span>
                          <span className="text-gray-500">ID: {report.id.slice(0, 8)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {duplicates.length === 0 && !scanning && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">No duplicates found!</span>
                </div>
              </div>
            )}
          </div>

          {/* Cleanup Section */}
          {duplicates.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Step 2: Clean Up Duplicates</h3>
                  <p className="text-sm text-gray-600">Keep the newest copy of each report and delete older duplicates</p>
                </div>
                <button
                  onClick={cleanupDuplicates}
                  disabled={cleaning}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {cleaning ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {cleaning ? 
                    `Processing ${progress.current}/${progress.total}...` : 
                    'Delete Duplicates'
                  }
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  ⚠️ This will permanently delete {duplicates.reduce((sum, group) => sum + group.length - 1, 0)} duplicate reports.
                  The newest copy of each report will be kept.
                </p>
                <p className="text-red-600 text-xs mt-2">
                  💡 Large batches are processed quickly in the background - you won&apos;t need to wait!
                </p>
                
                {/* Progress Bar */}
                {cleaning && progress.total > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-red-700 mb-1">
                      <span>Deleting duplicates...</span>
                      <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Section */}
          {cleanupResults && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Cleanup Complete!</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>✅ Reports kept: {cleanupResults.kept}</p>
                <p>🗑️ Reports deleted: {cleanupResults.deleted}</p>
                {cleanupResults.failed > 0 && (
                  <p>❌ Failed deletions: {cleanupResults.failed}</p>
                )}
              </div>
            </div>
          )}

          {/* Current Stats */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Reports:</span>
                <span className="ml-2 font-medium">{reports.length}</span>
              </div>
              <div>
                <span className="text-gray-600">User:</span>
                <span className="ml-2 font-medium">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatabaseCleanup