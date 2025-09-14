import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, X, RefreshCw } from 'lucide-react';

/**
 * System Status Banner Component
 * Displays real-time system status with feature availability indicators
 */
export default function SystemStatusBanner({
  organization = null,
  onStatusChange = null
}) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Determine if we should show the banner
  const shouldShowBanner = !dismissed && status &&
    (status.overall !== 'operational' || status.maintenance);

  // Fetch system status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/system-status');
      const statusData = await response.json();

      setStatus(statusData);
      setLastUpdate(new Date());

      // Notify parent component of status change
      if (onStatusChange) {
        onStatusChange(statusData);
      }

      // Auto-dismiss if system becomes operational and no maintenance
      if (statusData.overall === 'operational' && !statusData.maintenance) {
        setDismissed(false); // Allow showing again for future issues
      }

    } catch (error) {
      console.error('Failed to fetch system status:', error);
      setStatus({
        overall: 'error',
        message: {
          title: 'Status Check Failed',
          message: 'Unable to check system status',
          color: 'red'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Polling effect for real-time updates
  useEffect(() => {
    fetchStatus();

    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Get status styling
  const getStatusStyling = (statusType) => {
    const styles = {
      operational: {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600',
        iconComponent: CheckCircle
      },
      degraded: {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-600',
        iconComponent: AlertTriangle
      },
      maintenance: {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600',
        iconComponent: Clock
      },
      incident: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        icon: 'text-red-600',
        iconComponent: AlertTriangle
      },
      error: {
        bg: 'bg-gray-50 border-gray-200',
        text: 'text-gray-800',
        icon: 'text-gray-600',
        iconComponent: AlertTriangle
      }
    };

    return styles[statusType] || styles.error;
  };

  // Handle banner dismissal
  const handleDismiss = () => {
    setDismissed(true);

    // For non-critical issues, stay dismissed for session
    // For critical issues, re-check periodically
    if (status?.overall === 'incident') {
      setTimeout(() => {
        setDismissed(false);
        fetchStatus();
      }, 5 * 60 * 1000); // Re-check in 5 minutes for critical issues
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchStatus();
  };

  // Don't render if loading, dismissed, or no status to show
  if (loading || !shouldShowBanner || !status) {
    return null;
  }

  const styling = getStatusStyling(status.overall);
  const IconComponent = styling.iconComponent;

  return (
    <div className={`${styling.bg} border-b ${styling.text} px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <IconComponent className={`h-5 w-5 ${styling.icon}`} />

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">{status.message?.title}</span>
              {status.maintenance?.active && (
                <span className="text-sm px-2 py-1 bg-white bg-opacity-50 rounded">
                  {status.maintenance.type === 'scheduled' ? 'Scheduled' : 'Emergency'}
                </span>
              )}
            </div>

            <p className="text-sm mt-1">{status.message?.message}</p>

            {/* Feature availability summary */}
            {status.features && (
              <div className="mt-2 text-xs space-x-4">
                {Object.entries(status.features).map(([feature, info]) => (
                  <span key={feature} className={info.available ? 'text-green-700' : 'text-red-700'}>
                    {feature.replace(/_/g, ' ')}: {info.available ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            )}

            {/* Maintenance timing */}
            {status.maintenance && (
              <div className="mt-2 text-xs">
                {status.maintenance.active ? (
                  <span>
                    In progress • Est. duration: {status.maintenance.estimatedDuration}
                  </span>
                ) : (
                  <span>
                    Scheduled: {new Date(status.maintenance.scheduledTime).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className={`p-1 rounded hover:bg-white hover:bg-opacity-50 ${styling.icon}`}
            title="Refresh status"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Last update time */}
          {lastUpdate && (
            <span className="text-xs opacity-75">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}

          {/* Dismiss button - only for non-critical issues */}
          {status.overall !== 'incident' && (
            <button
              onClick={handleDismiss}
              className={`p-1 rounded hover:bg-white hover:bg-opacity-50 ${styling.icon}`}
              title="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded details for critical issues */}
      {status.overall === 'incident' && status.services && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-red-200">
          <div className="text-sm">
            <strong>Service Status:</strong>
            <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(status.services).map(([service, info]) => (
                <div key={service} className="flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${
                    info.status === 'operational' ? 'bg-green-500' :
                    info.status === 'degraded' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></span>
                  <span className="capitalize">{service.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}