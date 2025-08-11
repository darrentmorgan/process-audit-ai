import { useState, useEffect } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle, FileJson } from 'lucide-react';

export default function AutomationGenerator({ 
  auditReportId, 
  processData, 
  automationOpportunities,
  userId,
  onClose 
}) {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('submitting'); // idle, submitting, processing, completed, failed
  const [progress, setProgress] = useState(0);
  const [automation, setAutomation] = useState(null);
  const [error, setError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Start automation generation
  const startGeneration = async () => {
    setStatus('submitting');
    setProgress(0);
    setError(null);

    try {
      const response = await fetch('/api/automations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auditReportId,
          processData,
          automationOpportunities,
          automationType: 'n8n',
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start automation generation');
      }

      const data = await response.json();
      setJobId(data.jobId);
      setStatus('processing');
      
      // Start polling for status
      startPolling(data.jobId);
    } catch (err) {
      console.error('Error starting generation:', err);
      setError(err.message);
      setStatus('failed');
    }
  };

  // Poll for job status
  const startPolling = (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/automations/status/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }

        const data = await response.json();
        const { job, automation: automationData } = data;

        setProgress(job.progress || 0);
        setStatus(job.status);

        if (job.status === 'completed' && automationData) {
          setAutomation(automationData);
          clearInterval(interval);
        } else if (job.status === 'failed') {
          setError(job.error_message || 'Automation generation failed');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling status:', err);
        // Continue polling even if there's an error
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Auto-start generation on mount so users immediately see progress
  useEffect(() => {
    if (!jobId) {
      startGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Download workflow
  const downloadWorkflow = async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/automations/download/${jobId}`);
      const workflow = await response.json();
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(workflow, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = (automation?.name || 'n8n_workflow').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${baseName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading workflow:', err);
      setError('Failed to download workflow');
    }
  };

  // Get status message
  const getStatusMessage = () => {
    switch (status) {
      case 'submitting':
        return 'Submitting automation request...';
      case 'processing':
        if (progress < 30) return 'Analyzing process requirements...';
        if (progress < 70) return 'Generating n8n workflow...';
        return 'Finalizing automation...';
      case 'completed':
        return 'Automation generated successfully!';
      case 'failed':
        return 'Failed to generate automation';
      default:
        return 'Ready to generate automation';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Generate n8n Automation</h2>
          <p className="text-gray-600 mt-1">
            Create a downloadable n8n workflow from your process analysis
          </p>
        </div>

        <div className="p-6">
          {status === 'idle' && (
            <div className="text-center py-8">
              <FileJson className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-6">
                Ready to generate an n8n workflow based on your process analysis.
                This will create a JSON file you can import directly into n8n.
              </p>
              <button
                onClick={startGeneration}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Generate n8n Workflow
              </button>
            </div>
          )}

          {(status === 'submitting' || status === 'processing') && (
            <div className="py-8">
              <div className="flex items-center justify-center mb-6">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
              
              <p className="text-center text-gray-700 mb-4">{getStatusMessage()}</p>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <p className="text-center text-sm text-gray-500">{progress}% complete</p>
            </div>
          )}

          {status === 'completed' && (
            <div className="py-8">
              <div className="flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              
              {automation && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                    {automation.name}
                  </h3>
                  <p className="text-gray-600 mb-6 text-center">{automation.description}</p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Instructions:</h4>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {automation.instructions}
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={downloadWorkflow}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  Download n8n Workflow
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="py-8">
              <div className="flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              
              <p className="text-center text-gray-700 mb-4">
                {error || 'An error occurred while generating the automation'}
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={startGeneration}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}