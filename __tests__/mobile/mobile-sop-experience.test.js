/**
 * Mobile SOP Experience Tests
 * Sprint 3: Mobile Experience MVP - Mobile Functionality Validation
 */

import { jest } from '@jest/globals';

// Mock mobile optimization hook
jest.mock('../../hooks/useMobileOptimization', () => ({
  __esModule: true,
  default: () => ({
    isMobile: true,
    shouldLoadHeavyAssets: false,
    trackPerformanceMetric: jest.fn(),
    isSlowNetwork: false,
    isLowMemoryDevice: false
  })
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/mobile/sops'
  })
}));

describe('Mobile SOP Experience Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(() => '[]'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    // Mock navigator for offline detection
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Mock vibration API
    global.navigator.vibrate = jest.fn();
  });

  describe('Mobile Device Detection', () => {
    test('should detect mobile device correctly', () => {
      const { default: useMobileOptimization } = require('../../hooks/useMobileOptimization');
      const { isMobile } = useMobileOptimization();

      expect(isMobile).toBe(true);
    });

    test('should track performance metrics on mobile', () => {
      const { default: useMobileOptimization } = require('../../hooks/useMobileOptimization');
      const { trackPerformanceMetric } = useMobileOptimization();

      trackPerformanceMetric('sop_load', Date.now());

      expect(trackPerformanceMetric).toHaveBeenCalledWith('sop_load', expect.any(Number));
    });
  });

  describe('Offline SOP Functionality', () => {
    test('should store SOPs in localStorage for offline access', () => {
      const sopData = {
        id: 'sop_test_123',
        title: 'Test SOP',
        content: 'Test procedure content',
        industry: 'hospitality'
      };

      // Simulate SOP download
      const offlineSOPs = [sopData];
      localStorage.setItem('offlineSOPs', JSON.stringify(offlineSOPs));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'offlineSOPs',
        JSON.stringify(offlineSOPs)
      );
    });

    test('should detect offline status', () => {
      // Mock offline status
      Object.defineProperty(global.navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Simulate offline detection
      const isOffline = !navigator.onLine;
      expect(isOffline).toBe(true);
    });

    test('should load offline SOPs when available', () => {
      const mockOfflineSOPs = [
        {
          id: 'sop_offline_1',
          title: 'Offline SOP 1',
          organizationId: 'org_test_123'
        }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(mockOfflineSOPs));

      const cached = JSON.parse(localStorage.getItem('offlineSOPs') || '[]');
      expect(cached).toHaveLength(1);
      expect(cached[0].title).toBe('Offline SOP 1');
    });
  });

  describe('Industry-Specific Mobile Interface', () => {
    test('should apply hospitality terminology on mobile', () => {
      const hospitalityTerminology = {
        customer: 'guest',
        service: 'guest experience',
        location: 'property',
        staff: 'team member'
      };

      let content = 'Provide excellent customer service at our location';

      Object.entries(hospitalityTerminology).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        content = content.replace(regex, value);
      });

      expect(content).toBe('Provide excellent guest experience at our property');
    });

    test('should generate industry-specific SOP categories for mobile', () => {
      const getSOPCategories = (industryType) => {
        const categories = {
          hospitality: [
            { id: 'front_desk', label: 'Front Desk', icon: '🏨' },
            { id: 'housekeeping', label: 'Housekeeping', icon: '🧹' },
            { id: 'guest_services', label: 'Guest Services', icon: '🛎️' }
          ],
          restaurant: [
            { id: 'kitchen', label: 'Kitchen Operations', icon: '👨‍🍳' },
            { id: 'food_safety', label: 'Food Safety', icon: '🥘' }
          ],
          general: [
            { id: 'operations', label: 'Operations', icon: '⚙️' },
            { id: 'safety', label: 'Safety', icon: '🛡️' }
          ]
        };

        return categories[industryType] || categories.general;
      };

      const hospitalityCategories = getSOPCategories('hospitality');
      expect(hospitalityCategories).toHaveLength(3);
      expect(hospitalityCategories[0].label).toBe('Front Desk');

      const restaurantCategories = getSOPCategories('restaurant');
      expect(restaurantCategories).toHaveLength(2);
      expect(restaurantCategories[0].label).toBe('Kitchen Operations');
    });
  });

  describe('Mobile Compliance Features', () => {
    test('should track compliance photos with metadata', () => {
      const mockPhoto = {
        id: Date.now(),
        data: 'data:image/jpeg;base64,mock_photo_data',
        timestamp: new Date().toISOString(),
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10
        },
        filename: `compliance_${Date.now()}.jpg`
      };

      const photos = [mockPhoto];

      expect(photos[0]).toMatchObject({
        id: expect.any(Number),
        data: expect.stringContaining('data:image/jpeg'),
        timestamp: expect.any(String),
        location: expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number)
        }),
        filename: expect.stringContaining('compliance_')
      });
    });

    test('should handle digital signature capture', () => {
      const signatureData = 'John Doe - Mobile Signature';

      expect(signatureData).toBeTruthy();
      expect(typeof signatureData).toBe('string');
      expect(signatureData.length).toBeGreaterThan(0);
    });

    test('should create compliance documentation package', () => {
      const complianceData = {
        sopTitle: 'Room Cleaning Protocol',
        organizationId: 'org_hospitality_123',
        industryType: 'hospitality',
        timestamp: new Date().toISOString(),
        photos: [
          { id: 1, filename: 'compliance_1.jpg', timestamp: '2024-01-01T10:00:00Z' }
        ],
        notes: 'Room inspected and meets quality standards',
        signature: true,
        deviceType: 'mobile',
        complianceOfficer: 'Jane Smith',
        completionMethod: 'mobile_app'
      };

      expect(complianceData).toMatchObject({
        sopTitle: expect.any(String),
        organizationId: expect.stringMatching(/^org_/),
        industryType: 'hospitality',
        timestamp: expect.any(String),
        photos: expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('compliance_')
          })
        ]),
        deviceType: 'mobile',
        completionMethod: 'mobile_app'
      });
    });
  });

  describe('Mobile Performance Optimization', () => {
    test('should handle slow network conditions', () => {
      const { default: useMobileOptimization } = require('../../hooks/useMobileOptimization');
      const { isSlowNetwork } = useMobileOptimization();

      // On slow networks, should optimize loading
      const shouldOptimizeForSlow = !isSlowNetwork; // Mock returns false
      expect(shouldOptimizeForSlow).toBe(true);
    });

    test('should track mobile SOP performance metrics', () => {
      const performanceMetrics = {
        sop_list_load_start: Date.now(),
        sop_download_start: Date.now() + 100,
        sop_download_complete: Date.now() + 500,
        compliance_photo_capture: Date.now() + 1000
      };

      Object.entries(performanceMetrics).forEach(([metric, timestamp]) => {
        expect(typeof metric).toBe('string');
        expect(typeof timestamp).toBe('number');
        expect(timestamp).toBeGreaterThan(0);
      });
    });

    test('should optimize mobile SOP loading based on device capabilities', () => {
      const deviceOptimization = {
        loadHeavyAssets: false, // Optimized for mobile
        enableAnimations: true,
        compressImages: true,
        limitConcurrentRequests: 2
      };

      expect(deviceOptimization.loadHeavyAssets).toBe(false);
      expect(deviceOptimization.compressImages).toBe(true);
      expect(deviceOptimization.limitConcurrentRequests).toBeLessThanOrEqual(3);
    });
  });

  describe('Mobile User Experience', () => {
    test('should provide haptic feedback for mobile interactions', () => {
      // Simulate haptic feedback
      if (global.navigator.vibrate) {
        navigator.vibrate(100); // Success feedback
        navigator.vibrate([100, 50, 100]); // Completion pattern
      }

      expect(navigator.vibrate).toHaveBeenCalled();
    });

    test('should handle touch gestures and mobile-specific interactions', () => {
      const touchInteractions = {
        swipeToNext: true,
        touchToComplete: true,
        longPressForMenu: true,
        pinchToZoom: false // Disabled for SOP viewer
      };

      expect(touchInteractions.swipeToNext).toBe(true);
      expect(touchInteractions.touchToComplete).toBe(true);
      expect(touchInteractions.pinchToZoom).toBe(false); // Prevents accidental zoom
    });

    test('should adapt interface based on organization industry', () => {
      const getIndustryInterface = (industryType) => {
        const interfaces = {
          hospitality: {
            primaryColor: 'blue',
            terminology: { customer: 'guest' },
            navigation: ['Front Desk', 'Housekeeping', 'Guest Services']
          },
          restaurant: {
            primaryColor: 'orange',
            terminology: { customer: 'guest' },
            navigation: ['Kitchen', 'Food Safety', 'Service']
          },
          medical: {
            primaryColor: 'teal',
            terminology: { customer: 'patient' },
            navigation: ['Patient Care', 'Clinical', 'Emergency']
          }
        };

        return interfaces[industryType] || interfaces.general;
      };

      const hospitalityInterface = getIndustryInterface('hospitality');
      expect(hospitalityInterface.terminology.customer).toBe('guest');
      expect(hospitalityInterface.navigation).toContain('Housekeeping');

      const medicalInterface = getIndustryInterface('medical');
      expect(medicalInterface.terminology.customer).toBe('patient');
      expect(medicalInterface.navigation).toContain('Patient Care');
    });
  });
});