// import { withSentry } from '@sentry/nextjs';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * System Status API for Real-time Status Monitoring
 * Provides intelligent system status with feature availability
 */

class SystemStatusManager {
  constructor() {
    this.statusCache = null;
    this.lastUpdate = null;
    this.cacheTTL = 30000; // 30 seconds cache
  }

  async getSystemStatus(correlationId) {
    // Return cached status if fresh
    if (this.statusCache && this.lastUpdate &&
        (Date.now() - this.lastUpdate) < this.cacheTTL) {
      return this.statusCache;
    }

    const status = {
      overall: 'operational', // operational, degraded, maintenance, incident
      timestamp: new Date().toISOString(),
      correlationId,
      services: {},
      features: {},
      maintenance: null,
      metrics: {}
    };

    try {
      // Check core services health
      await this.checkCoreServices(status, correlationId);

      // Determine feature availability
      await this.checkFeatureAvailability(status, correlationId);

      // Check for scheduled maintenance
      await this.checkMaintenanceStatus(status, correlationId);

      // Calculate overall status
      this.calculateOverallStatus(status);

      // Cache the status
      this.statusCache = status;
      this.lastUpdate = Date.now();

      logger.info('System status check completed', {
        correlationId,
        overallStatus: status.overall,
        servicesChecked: Object.keys(status.services).length,
        featuresChecked: Object.keys(status.features).length
      });

    } catch (error) {
      logger.error('System status check failed', error, { correlationId });
      status.overall = 'incident';
      status.error = 'Status check failed';
    }

    return status;
  }

  async checkCoreServices(status, correlationId) {
    console.log(`🔍 [${correlationId}] Checking core services...`);

    // Database check
    try {
      const dbCheckStart = Date.now();
      const healthResponse = await fetch('http://localhost:3000/api/health/deep', {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        const dbResponseTime = Date.now() - dbCheckStart;

        status.services.database = {
          status: healthData.checks.database?.status === 'healthy' ? 'operational' : 'degraded',
          responseTime: healthData.checks.database?.responseTime || `${dbResponseTime}ms`,
          lastCheck: new Date().toISOString()
        };

        status.services.ai_providers = {
          claude: {
            status: healthData.checks.claude_api?.status === 'healthy' ? 'operational' : 'degraded',
            responseTime: healthData.checks.claude_api?.responseTime
          },
          openai: {
            status: healthData.checks.openai_api?.status === 'healthy' ? 'operational' : 'degraded',
            responseTime: healthData.checks.openai_api?.responseTime
          }
        };

        status.services.workers = {
          status: healthData.checks.cloudflare_workers?.status === 'healthy' ? 'operational' : 'degraded',
          responseTime: healthData.checks.cloudflare_workers?.responseTime
        };

      } else {
        status.services.database = { status: 'incident', error: 'Health check failed' };
        status.services.ai_providers = { status: 'unknown', error: 'Cannot verify AI provider status' };
        status.services.workers = { status: 'unknown', error: 'Cannot verify worker status' };
      }
    } catch (error) {
      console.error(`❌ [${correlationId}] Core services check failed:`, error.message);
      status.services.database = { status: 'incident', error: error.message };
      status.services.ai_providers = { status: 'incident', error: 'Service check failed' };
      status.services.workers = { status: 'incident', error: 'Service check failed' };
    }
  }

  async checkFeatureAvailability(status, correlationId) {
    console.log(`🎛️ [${correlationId}] Checking feature availability...`);

    // Process Analysis feature
    const aiProvidersHealthy =
      status.services.ai_providers?.claude?.status === 'operational' ||
      status.services.ai_providers?.openai?.status === 'operational';

    status.features.process_analysis = {
      available: aiProvidersHealthy && status.services.database?.status !== 'incident',
      reason: !aiProvidersHealthy ? 'AI providers unavailable' :
              status.services.database?.status === 'incident' ? 'Database unavailable' : null,
      alternatives: !aiProvidersHealthy ? ['Queue for later processing', 'Use template-based analysis'] : []
    };

    // PDF Generation feature
    status.features.pdf_generation = {
      available: status.services.database?.status !== 'incident',
      reason: status.services.database?.status === 'incident' ? 'Database unavailable' : null,
      alternatives: status.services.database?.status === 'incident' ?
        ['HTML preview', 'Email delivery when restored'] : []
    };

    // Saved Reports feature
    status.features.saved_reports = {
      available: status.services.database?.status === 'operational',
      reason: status.services.database?.status !== 'operational' ? 'Database issues' : null,
      alternatives: status.services.database?.status !== 'operational' ?
        ['Download reports locally', 'Email reports'] : []
    };

    // Automation Generation (depends on workers and AI)
    const automationAvailable = status.services.workers?.status === 'operational' && aiProvidersHealthy;
    status.features.automation_generation = {
      available: automationAvailable,
      reason: status.services.workers?.status !== 'operational' ? 'Background processing unavailable' :
              !aiProvidersHealthy ? 'AI providers unavailable' : null,
      alternatives: !automationAvailable ?
        ['Manual workflow documentation', 'Queue for later processing'] : []
    };
  }

  async checkMaintenanceStatus(status, correlationId) {
    console.log(`🔧 [${correlationId}] Checking maintenance status...`);

    // Check for maintenance flag (in production, this could be from database or config)
    const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    const scheduledMaintenance = process.env.SCHEDULED_MAINTENANCE_START;

    if (maintenanceMode) {
      status.maintenance = {
        active: true,
        type: 'emergency',
        message: 'Emergency maintenance in progress',
        estimatedDuration: process.env.MAINTENANCE_DURATION || 'Unknown',
        startTime: process.env.MAINTENANCE_START || new Date().toISOString()
      };
      status.overall = 'maintenance';
    } else if (scheduledMaintenance) {
      const maintenanceStart = new Date(scheduledMaintenance);
      const now = new Date();

      if (maintenanceStart > now && (maintenanceStart - now) < 24 * 60 * 60 * 1000) {
        status.maintenance = {
          active: false,
          type: 'scheduled',
          message: 'Scheduled maintenance upcoming',
          scheduledTime: maintenanceStart.toISOString(),
          estimatedDuration: process.env.SCHEDULED_MAINTENANCE_DURATION || '30 minutes',
          advanceNotice: true
        };
      }
    }
  }

  calculateOverallStatus(status) {
    // If maintenance is active, that takes precedence
    if (status.maintenance?.active) {
      status.overall = 'maintenance';
      return;
    }

    // Check for incidents (any service completely down)
    const incidentServices = Object.values(status.services).filter(service =>
      service.status === 'incident' ||
      (typeof service === 'object' && Object.values(service).some(s => s.status === 'incident'))
    );

    if (incidentServices.length > 0) {
      status.overall = 'incident';
      return;
    }

    // Check for degraded services
    const degradedServices = Object.values(status.services).filter(service =>
      service.status === 'degraded' ||
      (typeof service === 'object' && Object.values(service).some(s => s.status === 'degraded'))
    );

    if (degradedServices.length > 0) {
      status.overall = 'degraded';
      return;
    }

    // All services operational
    status.overall = 'operational';
  }

  getStatusMessage(status) {
    const messages = {
      operational: {
        title: 'All Systems Operational',
        message: 'All features are available and functioning normally.',
        color: 'green'
      },
      degraded: {
        title: 'Some Features Affected',
        message: 'Some features may be slower than usual. We\'re working to resolve this.',
        color: 'yellow'
      },
      maintenance: {
        title: status.maintenance?.type === 'emergency' ? 'Emergency Maintenance' : 'Scheduled Maintenance',
        message: status.maintenance?.message || 'Maintenance in progress to improve your experience.',
        color: 'blue'
      },
      incident: {
        title: 'Service Disruption',
        message: 'We\'re experiencing technical difficulties and working to restore service.',
        color: 'red'
      }
    };

    return messages[status.overall] || messages.incident;
  }
}

const statusManager = new SystemStatusManager();

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  const correlationId = uuidv4();

  try {
    const startTime = Date.now();

    const systemStatus = await statusManager.getSystemStatus(correlationId);
    const statusMessage = statusManager.getStatusMessage(systemStatus);

    const response = {
      ...systemStatus,
      message: statusMessage,
      responseTime: `${Date.now() - startTime}ms`
    };

    // Set appropriate status code based on system health
    const statusCode = systemStatus.overall === 'operational' ? 200 :
                     systemStatus.overall === 'degraded' ? 200 :
                     systemStatus.overall === 'maintenance' ? 503 :
                     503; // incident

    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('System status API failed', error, { correlationId });

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      correlationId,
      error: 'Status check failed',
      message: {
        title: 'Status Check Failed',
        message: 'Unable to determine system status. Please try again.',
        color: 'red'
      }
    });
  }
}

export default handler;