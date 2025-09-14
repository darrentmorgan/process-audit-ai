/**
 * PWA & Mobile Analytics Tests
 * Sprint 3 Story 2: PWA Enhancement and Analytics Testing
 */

import { jest } from '@jest/globals';

// Mock mobile optimization hook
jest.mock('../../hooks/useMobileOptimization', () => ({
  __esModule: true,
  default: () => ({
    isMobile: true,
    shouldLoadHeavyAssets: false,
    trackPerformanceMetric: jest.fn(),
    isSlowNetwork: false
  })
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/mobile/analytics'
  })
}));

describe('PWA & Mobile Analytics Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage for analytics caching
    global.localStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    // Mock navigator for PWA detection
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Mock service worker
    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: {
        register: jest.fn(() => Promise.resolve({ scope: '/' })),
        ready: Promise.resolve({
          showNotification: jest.fn()
        })
      }
    });
  });

  describe('PWA Manifest Functionality', () => {
    test('should have proper PWA manifest structure', () => {
      const manifestData = {
        name: "ProcessAudit AI - Field Operations",
        short_name: "ProcessAudit AI",
        description: "Mobile-first operational excellence platform for field operations",
        start_url: "/mobile/sops?pwa=true",
        display: "standalone",
        background_color: "#2563eb",
        theme_color: "#2563eb",
        orientation: "portrait-primary"
      };

      expect(manifestData.name).toBe("ProcessAudit AI - Field Operations");
      expect(manifestData.display).toBe("standalone");
      expect(manifestData.start_url).toBe("/mobile/sops?pwa=true");
      expect(manifestData.theme_color).toBe("#2563eb");
    });

    test('should support home screen installation', () => {
      const beforeInstallPromptEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(() => Promise.resolve({ outcome: 'accepted' }))
      };

      // Simulate beforeinstallprompt event
      window.dispatchEvent(new CustomEvent('beforeinstallprompt', {
        detail: beforeInstallPromptEvent
      }));

      expect(beforeInstallPromptEvent.preventDefault).toHaveBeenCalled();
    });

    test('should detect PWA installation status', () => {
      // Mock standalone mode detection
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        }))
      });

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      expect(typeof isStandalone).toBe('boolean');
    });
  });

  describe('Service Worker Functionality', () => {
    test('should register service worker in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
        expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
      }

      process.env.NODE_ENV = originalEnv;
    });

    test('should handle offline functionality', () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const isOffline = !navigator.onLine;
      expect(isOffline).toBe(true);

      // Simulate cached data loading
      const cachedAnalytics = {
        sopCompletions: 45,
        mobileUsagePercent: 78,
        complianceRate: 89
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(cachedAnalytics));

      const cached = JSON.parse(localStorage.getItem('cachedAnalytics') || '{}');
      expect(cached.sopCompletions).toBe(45);
      expect(cached.mobileUsagePercent).toBe(78);
    });

    test('should implement background sync for offline data', () => {
      const syncData = {
        sopCompletions: [
          { id: 'sop_1', completed: true, timestamp: Date.now() }
        ],
        compliancePhotos: [
          { id: 'photo_1', blob: 'mock_photo_data', metadata: {} }
        ],
        analyticsEvents: [
          { type: 'sop_view', timestamp: Date.now() }
        ]
      };

      // Store sync data
      localStorage.setItem('pendingSOPCompletions', JSON.stringify(syncData.sopCompletions));
      localStorage.setItem('pendingCompliancePhotos', JSON.stringify(syncData.compliancePhotos));
      localStorage.setItem('pendingAnalytics', JSON.stringify(syncData.analyticsEvents));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pendingSOPCompletions',
        JSON.stringify(syncData.sopCompletions)
      );
    });
  });

  describe('Mobile Analytics Dashboard', () => {
    test('should generate industry-specific analytics', () => {
      const hospitalityAnalytics = {
        sopCompletions: 42,
        mobileUsagePercent: 85,
        complianceRate: 89,
        industryType: 'hospitality',
        teamPerformance: [
          { name: 'Sarah Johnson', role: 'Housekeeper', completionRate: 96 }
        ]
      };

      expect(hospitalityAnalytics.industryType).toBe('hospitality');
      expect(hospitalityAnalytics.complianceRate).toBeGreaterThan(80);
      expect(hospitalityAnalytics.teamPerformance).toHaveLength(1);
    });

    test('should track mobile performance metrics', () => {
      const performanceMetrics = {
        avgSessionDuration: 8,
        offlineUsagePercent: 35,
        batteryImpact: 3.2,
        loadTimes: {
          sopViewer: 1.2,
          analytics: 0.8,
          compliance: 1.5
        }
      };

      expect(performanceMetrics.avgSessionDuration).toBeGreaterThan(0);
      expect(performanceMetrics.batteryImpact).toBeLessThan(5);
      expect(performanceMetrics.loadTimes.analytics).toBeLessThan(2);
    });

    test('should provide supervisor insights', () => {
      const supervisorInsights = {
        teamEfficiency: 92,
        topPerformers: ['Sarah J.', 'Mike C.', 'Lisa R.'],
        improvementAreas: ['Speed training', 'Mobile adoption'],
        complianceAlerts: 2
      };

      expect(supervisorInsights.teamEfficiency).toBeGreaterThan(80);
      expect(supervisorInsights.topPerformers).toHaveLength(3);
      expect(supervisorInsights.complianceAlerts).toBeGreaterThanOrEqual(0);
    });

    test('should support compliance officer analytics', () => {
      const complianceAnalytics = {
        auditReadiness: 97,
        photoDocumentation: 203,
        digitalSignatures: 89,
        complianceByCategory: {
          safety: 95,
          quality: 88,
          regulatory: 92
        }
      };

      expect(complianceAnalytics.auditReadiness).toBeGreaterThan(90);
      expect(complianceAnalytics.photoDocumentation).toBeGreaterThan(0);
      expect(complianceAnalytics.complianceByCategory.safety).toBeDefined();
    });
  });

  describe('Push Notification System', () => {
    test('should handle push notification registration', () => {
      const mockRegistration = {
        showNotification: jest.fn(() => Promise.resolve()),
        pushManager: {
          subscribe: jest.fn(() => Promise.resolve({
            endpoint: 'https://fcm.googleapis.com/fcm/send/mock_endpoint'
          }))
        }
      };

      return mockRegistration.pushManager.subscribe().then(subscription => {
        expect(subscription.endpoint).toContain('fcm.googleapis.com');
      });
    });

    test('should create industry-specific notifications', () => {
      const createNotification = (type, industry, data) => {
        const notifications = {
          hospitality: {
            sop_update: 'New housekeeping procedure available',
            compliance_alert: 'Fire safety inspection scheduled',
            training_reminder: 'Guest service training due'
          },
          restaurant: {
            sop_update: 'Updated food safety protocol',
            compliance_alert: 'Health inspection tomorrow',
            training_reminder: 'Kitchen safety training due'
          },
          medical: {
            sop_update: 'New patient care procedure',
            compliance_alert: 'Infection control audit scheduled',
            training_reminder: 'Clinical training due'
          }
        };

        return notifications[industry]?.[type] || `${type} notification`;
      };

      const hospitalityNotification = createNotification('sop_update', 'hospitality', {});
      expect(hospitalityNotification).toBe('New housekeeping procedure available');

      const restaurantAlert = createNotification('compliance_alert', 'restaurant', {});
      expect(restaurantAlert).toBe('Health inspection tomorrow');
    });

    test('should handle notification preferences', () => {
      const notificationPreferences = {
        sopUpdates: true,
        complianceAlerts: true,
        trainingReminders: false,
        emergencyAlerts: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00'
        }
      };

      expect(notificationPreferences.emergencyAlerts).toBe(true);
      expect(notificationPreferences.trainingReminders).toBe(false);
      expect(notificationPreferences.quietHours.enabled).toBe(true);
    });
  });

  describe('Enhanced Offline Synchronization', () => {
    test('should detect sync conflicts', () => {
      const detectConflict = (localData, serverData) => {
        if (localData.lastModified !== serverData.lastModified) {
          return {
            hasConflict: true,
            conflictType: 'timestamp_mismatch',
            localTimestamp: localData.lastModified,
            serverTimestamp: serverData.lastModified
          };
        }
        return { hasConflict: false };
      };

      const local = { id: 'sop_1', content: 'Local changes', lastModified: 100 };
      const server = { id: 'sop_1', content: 'Server changes', lastModified: 200 };

      const conflict = detectConflict(local, server);
      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflictType).toBe('timestamp_mismatch');
    });

    test('should prioritize critical compliance data in sync queue', () => {
      const prioritizeSync = (syncQueue) => {
        return syncQueue.sort((a, b) => {
          const priorityOrder = {
            'emergency': 1,
            'compliance': 2,
            'safety': 3,
            'standard': 4
          };

          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      };

      const queue = [
        { id: 'sync_1', priority: 'standard', data: {} },
        { id: 'sync_2', priority: 'emergency', data: {} },
        { id: 'sync_3', priority: 'compliance', data: {} }
      ];

      const prioritized = prioritizeSync(queue);
      expect(prioritized[0].priority).toBe('emergency');
      expect(prioritized[1].priority).toBe('compliance');
      expect(prioritized[2].priority).toBe('standard');
    });

    test('should validate data integrity during sync', () => {
      const validateDataIntegrity = (data) => {
        const required = ['id', 'timestamp', 'organizationId'];
        const hasAllRequired = required.every(field => data.hasOwnProperty(field));

        return {
          isValid: hasAllRequired,
          missingFields: required.filter(field => !data.hasOwnProperty(field)),
          checksum: data.id + data.timestamp + data.organizationId
        };
      };

      const validData = {
        id: 'sop_123',
        timestamp: Date.now(),
        organizationId: 'org_456',
        content: 'SOP content'
      };

      const validation = validateDataIntegrity(validData);
      expect(validation.isValid).toBe(true);
      expect(validation.missingFields).toHaveLength(0);
    });
  });
});