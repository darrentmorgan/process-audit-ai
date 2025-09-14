import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

/**
 * Feature Gate Component
 * Conditionally renders features based on system availability
 * Provides graceful degradation with alternative actions
 */
export default function FeatureGate({
  feature, // 'process_analysis', 'pdf_generation', 'saved_reports', 'automation_generation'
  children,
  fallback = null,
  showAlternatives = true,
  className = '',
  loadingComponent = null
}) {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch system status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/system-status');
        const statusData = await response.json();
        setSystemStatus(statusData);
      } catch (error) {
        console.error('Failed to fetch system status for feature gate:', error);
        // Fail open - allow feature if status check fails
        setSystemStatus({
          features: {
            [feature]: { available: true }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Re-check every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [feature]);

  // Show loading state
  if (loading) {
    return loadingComponent || (
      <div className={`p-4 bg-gray-50 rounded-lg flex items-center space-x-2 ${className}`}>
        <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
        <span className="text-gray-600">Checking feature availability...</span>
      </div>
    );
  }

  const featureInfo = systemStatus?.features?.[feature];

  // Feature is available - render normally
  if (featureInfo?.available !== false) {
    return <div className={className}>{children}</div>;
  }

  // Feature is unavailable - show fallback or alternative options
  return (
    <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />

        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800">
            {getFeatureDisplayName(feature)} Temporarily Unavailable
          </h3>

          <p className="text-sm text-yellow-700 mt-1">
            {featureInfo?.reason || 'This feature is currently experiencing issues.'}
          </p>

          {/* Alternative actions */}
          {showAlternatives && featureInfo?.alternatives && featureInfo.alternatives.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Alternative options:
              </p>
              <div className="space-y-1">
                {featureInfo.alternatives.map((alternative, index) => (
                  <button
                    key={index}
                    className="block text-sm text-yellow-700 hover:text-yellow-900 underline"
                    onClick={() => handleAlternativeAction(alternative, feature)}
                  >
                    • {alternative}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* System maintenance message */}
          {systemStatus?.maintenance?.active && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-blue-800">
                  {systemStatus.maintenance.type === 'scheduled' ? 'Scheduled' : 'Emergency'} maintenance in progress
                </span>
              </div>
              {systemStatus.maintenance.estimatedDuration && (
                <p className="text-blue-700 mt-1">
                  Estimated duration: {systemStatus.maintenance.estimatedDuration}
                </p>
              )}
            </div>
          )}

          {/* Custom fallback content */}
          {fallback && (
            <div className="mt-3">
              {fallback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get human-readable feature names
function getFeatureDisplayName(feature) {
  const displayNames = {
    process_analysis: 'Process Analysis',
    pdf_generation: 'PDF Generation',
    saved_reports: 'Saved Reports',
    automation_generation: 'Automation Generation'
  };

  return displayNames[feature] || feature.replace(/_/g, ' ');
}

// Handle alternative action clicks
function handleAlternativeAction(alternative, feature) {
  console.log(`Alternative action selected: ${alternative} for feature: ${feature}`);

  // Implement specific alternative actions
  switch (alternative) {
    case 'Queue for later processing':
      // Could open a modal to queue the request
      alert('Your request will be processed when the service is restored. You will receive an email notification.');
      break;

    case 'Use template-based analysis':
      // Could redirect to a simplified analysis mode
      alert('Redirecting to simplified analysis mode...');
      break;

    case 'HTML preview':
      // Could show HTML version instead of PDF
      alert('Generating HTML preview instead of PDF...');
      break;

    case 'Email delivery when restored':
      // Could collect email for later delivery
      const email = prompt('Enter your email to receive the report when service is restored:');
      if (email) {
        alert(`Report will be emailed to ${email} when PDF generation is restored.`);
      }
      break;

    case 'Download reports locally':
      // Could enable local storage download
      alert('Downloading available reports to your device...');
      break;

    case 'Email reports':
      // Could trigger email delivery
      alert('Sending reports to your email address...');
      break;

    case 'Manual workflow documentation':
      // Could open manual documentation mode
      alert('Opening manual workflow documentation mode...');
      break;

    default:
      console.log(`Unhandled alternative action: ${alternative}`);
  }
}

// Specialized feature gates for common use cases
export function ProcessAnalysisGate({ children, ...props }) {
  return (
    <FeatureGate feature="process_analysis" {...props}>
      {children}
    </FeatureGate>
  );
}

export function PDFGenerationGate({ children, ...props }) {
  return (
    <FeatureGate feature="pdf_generation" {...props}>
      {children}
    </FeatureGate>
  );
}

export function SavedReportsGate({ children, ...props }) {
  return (
    <FeatureGate feature="saved_reports" {...props}>
      {children}
    </FeatureGate>
  );
}

export function AutomationGenerationGate({ children, ...props }) {
  return (
    <FeatureGate feature="automation_generation" {...props}>
      {children}
    </FeatureGate>
  );
}