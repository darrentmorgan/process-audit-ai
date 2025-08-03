import { useState, useEffect } from 'react'
import { X, FileText, Calendar, Trash2, Heart, Download, Clock } from 'lucide-react'
import { useAuditReports } from '../hooks/useSupabase'

const SavedReportsModal = ({ isOpen, onClose, onLoadReport }) => {
  const { reports, loading, deleteReport, loadReports } = useAuditReports()
  const [deleting, setDeleting] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (isOpen && !hasLoaded && !loading) {
      console.log('SavedReportsModal: Modal opened, loading reports...')
      setHasLoaded(true)
      loadReports()
    }
    
    // Reset hasLoaded when modal closes
    if (!isOpen) {
      setHasLoaded(false)
    }
  }, [isOpen, hasLoaded, loading, loadReports])

  const handleLoadReport = (report) => {
    console.log('Loading saved report:', report.title)
    
    // Convert the saved report back to the format expected by ProcessAuditApp
    const reportData = {
      reportId: report.id, // Add the report ID to identify this as a loaded report
      processDescription: report.process_description,
      fileContent: report.file_content || '',
      questions: [], // We don't save questions, but that's ok
      answers: report.answers || {},
      auditReport: report.report_data
    }
    
    onLoadReport(reportData)
    onClose()
  }

  const handleDeleteReport = async (reportId, reportTitle) => {
    if (!confirm(`Are you sure you want to delete "${reportTitle}"?`)) {
      return
    }
    
    setDeleting(reportId)
    try {
      await deleteReport(reportId)
    } catch (error) {
      console.error('Failed to delete report:', error)
      alert('Failed to delete report')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getReportSummary = (reportData) => {
    if (!reportData || !reportData.executiveSummary) {
      return 'Process audit report'
    }
    
    const summary = reportData.executiveSummary
    return `${summary.quickWins || 0} quick wins • ${summary.totalTimeSavings || 'Unknown'} savings`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Saved Reports</h2>
            <p className="text-gray-600 mt-1">Click on any report to load it</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Loading your reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved reports</h3>
              <p className="text-gray-600">
                Complete a process audit to save your first report
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => handleLoadReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary">
                          {report.title}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {report.process_description.substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(report.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getReportSummary(report.report_data)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteReport(report.id, report.title)
                        }}
                        disabled={deleting === report.id}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete report"
                      >
                        {deleting === report.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Click to load this report</span>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Load Report
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && reports.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              You have {reports.length} saved report{reports.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedReportsModal