/**
 * Mobile SOP List Component
 * Sprint 3: Mobile Experience MVP - SOP Browsing and Search
 *
 * Provides touch-optimized SOP browsing with offline capabilities
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Download,
  WifiOff,
  Wifi,
  Filter,
  BookOpen,
  Shield,
  AlertTriangle,
  Clock,
  ChevronRight,
  Star
} from 'lucide-react';
import useMobileOptimization from '../../hooks/useMobileOptimization';

export default function MobileSOPList({
  organization = null,
  onSOPSelect = null,
  onCreateSOP = null
}) {
  const { isMobile, isSlowNetwork, trackPerformanceMetric } = useMobileOptimization();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [sops, setSOPs] = useState([]);
  const [offlineSOPs, setOfflineSOPs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load SOPs for organization
  useEffect(() => {
    loadSOPs();
    loadOfflineSOPs();
  }, [organization]);

  const loadSOPs = useCallback(async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      trackPerformanceMetric('sop_list_load_start', Date.now());

      // Simulate SOP data based on organization industry
      const industryType = organization?.industry_type || 'general';

      const mockSOPs = generateMockSOPs(industryType, organization);
      setSOPs(mockSOPs);

      trackPerformanceMetric('sop_list_load_complete', Date.now());
    } catch (error) {
      console.error('Failed to load SOPs:', error);
    } finally {
      setLoading(false);
    }
  }, [isOffline, organization, trackPerformanceMetric]);

  const loadOfflineSOPs = useCallback(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('offlineSOPs') || '[]');
      const orgSOPs = cached.filter(sop =>
        !organization?.id || sop.organizationId === organization.id
      );
      setOfflineSOPs(orgSOPs);
    } catch (error) {
      console.error('Failed to load offline SOPs:', error);
      setOfflineSOPs([]);
    }
  }, [organization]);

  // Industry-specific SOP categories
  const getSOPCategories = useCallback(() => {
    const industryType = organization?.industry_type || 'general';

    const categories = {
      hospitality: [
        { id: 'front_desk', label: 'Front Desk', icon: '🏨' },
        { id: 'housekeeping', label: 'Housekeeping', icon: '🧹' },
        { id: 'guest_services', label: 'Guest Services', icon: '🛎️' },
        { id: 'safety', label: 'Safety & Security', icon: '🛡️' },
        { id: 'maintenance', label: 'Maintenance', icon: '🔧' }
      ],
      restaurant: [
        { id: 'kitchen', label: 'Kitchen Operations', icon: '👨‍🍳' },
        { id: 'food_safety', label: 'Food Safety', icon: '🥘' },
        { id: 'customer_service', label: 'Customer Service', icon: '🍽️' },
        { id: 'cleaning', label: 'Cleaning & Sanitation', icon: '🧽' },
        { id: 'compliance', label: 'Health Compliance', icon: '📋' }
      ],
      medical: [
        { id: 'patient_care', label: 'Patient Care', icon: '🏥' },
        { id: 'clinical', label: 'Clinical Procedures', icon: '🩺' },
        { id: 'infection_control', label: 'Infection Control', icon: '🦠' },
        { id: 'emergency', label: 'Emergency Procedures', icon: '🚨' },
        { id: 'documentation', label: 'Documentation', icon: '📝' }
      ],
      general: [
        { id: 'operations', label: 'Operations', icon: '⚙️' },
        { id: 'safety', label: 'Safety', icon: '🛡️' },
        { id: 'quality', label: 'Quality Control', icon: '✅' },
        { id: 'training', label: 'Training', icon: '📚' },
        { id: 'compliance', label: 'Compliance', icon: '📋' }
      ]
    };

    return categories[industryType] || categories.general;
  }, [organization]);

  // Filter SOPs based on search and category
  const filteredSOPs = useMemo(() => {
    let sopList = showOfflineOnly ? offlineSOPs : sops;

    if (searchTerm) {
      sopList = sopList.filter(sop =>
        sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sop.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sop.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      sopList = sopList.filter(sop => sop.category === selectedCategory);
    }

    return sopList;
  }, [sops, offlineSOPs, searchTerm, selectedCategory, showOfflineOnly]);

  // Download SOP for offline access
  const handleDownloadSOP = useCallback(async (sop) => {
    try {
      const sopCache = {
        ...sop,
        downloadedAt: new Date().toISOString(),
        organizationId: organization?.id
      };

      const existingCache = JSON.parse(localStorage.getItem('offlineSOPs') || '[]');
      const updatedCache = [...existingCache.filter(s => s.id !== sop.id), sopCache];

      localStorage.setItem('offlineSOPs', JSON.stringify(updatedCache));
      loadOfflineSOPs();

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

    } catch (error) {
      console.error('Failed to download SOP:', error);
    }
  }, [organization, loadOfflineSOPs]);

  const categories = getSOPCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">
              SOPs - {organization?.name || 'Organization'}
            </h1>

            <div className="flex items-center space-x-2">
              {isOffline ? (
                <WifiOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Wifi className="w-5 h-5 text-green-500" />
              )}

              <button
                onClick={() => setShowOfflineOnly(!showOfflineOnly)}
                className={`p-2 rounded-lg ${
                  showOfflineOnly
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search SOPs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex overflow-x-auto space-x-2 pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SOP List */}
      <div className="p-4 pb-24">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredSOPs.length > 0 ? (
          <div className="space-y-3">
            {filteredSOPs.map((sop) => {
              const isDownloaded = offlineSOPs.some(offline => offline.id === sop.id);

              return (
                <button
                  key={sop.id}
                  onClick={() => onSOPSelect?.(sop)}
                  className="w-full bg-white rounded-xl p-4 border border-gray-200 text-left transition-all active:scale-98"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-gray-900 mr-2">
                          {sop.title}
                        </h3>
                        {sop.priority === 'emergency' && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        {sop.complianceRequired && (
                          <Shield className="w-4 h-4 text-purple-500" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {sop.description}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          ~{sop.estimatedTime} min
                        </span>
                        <span className="capitalize">{sop.category}</span>
                        {isDownloaded && (
                          <span className="flex items-center text-green-600">
                            <Download className="w-3 h-3 mr-1" />
                            Offline
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 ml-3">
                      <ChevronRight className="w-5 h-5 text-gray-400" />

                      {!isDownloaded && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadSOP(sop);
                          }}
                          className="p-1 rounded-md bg-blue-100 text-blue-600"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showOfflineOnly ? 'No Offline SOPs' : 'No SOPs Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {showOfflineOnly
                ? 'Download SOPs for offline access'
                : searchTerm
                ? 'Try adjusting your search terms'
                : 'No SOPs available for this organization'
              }
            </p>
            {!showOfflineOnly && onCreateSOP && (
              <button
                onClick={onCreateSOP}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
              >
                Create First SOP
              </button>
            )}
          </div>
        )}
      </div>

      {/* Offline Status Bar */}
      {isOffline && (
        <div className="fixed bottom-0 left-0 right-0 bg-orange-500 text-white p-3 text-center">
          <div className="flex items-center justify-center">
            <WifiOff className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">
              Offline Mode - {offlineSOPs.length} SOPs Available
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Generate mock SOPs based on industry type
function generateMockSOPs(industryType, organization) {
  const baseSOPs = {
    hospitality: [
      {
        id: 'sop_checkin',
        title: 'Guest Check-In Procedure',
        description: 'Standard guest check-in process with upselling and preferences',
        category: 'front_desk',
        estimatedTime: 8,
        complianceRequired: false,
        priority: 'standard'
      },
      {
        id: 'sop_housekeeping',
        title: 'Room Cleaning Protocol',
        description: 'Comprehensive room cleaning with quality checkpoints',
        category: 'housekeeping',
        estimatedTime: 25,
        complianceRequired: true,
        priority: 'standard'
      },
      {
        id: 'sop_emergency',
        title: 'Fire Emergency Response',
        description: 'Fire emergency evacuation and guest safety procedures',
        category: 'safety',
        estimatedTime: 5,
        complianceRequired: true,
        priority: 'emergency'
      },
      {
        id: 'sop_maintenance',
        title: 'HVAC Maintenance Check',
        description: 'Daily HVAC system inspection and maintenance log',
        category: 'maintenance',
        estimatedTime: 15,
        complianceRequired: true,
        priority: 'standard'
      }
    ],
    restaurant: [
      {
        id: 'sop_food_prep',
        title: 'Food Preparation Safety',
        description: 'Safe food handling and preparation procedures',
        category: 'kitchen',
        estimatedTime: 12,
        complianceRequired: true,
        priority: 'standard'
      },
      {
        id: 'sop_temp_control',
        title: 'Temperature Control Log',
        description: 'Food temperature monitoring and documentation',
        category: 'food_safety',
        estimatedTime: 8,
        complianceRequired: true,
        priority: 'standard'
      },
      {
        id: 'sop_cleaning',
        title: 'Kitchen Deep Clean',
        description: 'End-of-day kitchen cleaning and sanitization',
        category: 'cleaning',
        estimatedTime: 45,
        complianceRequired: true,
        priority: 'standard'
      }
    ],
    medical: [
      {
        id: 'sop_hand_hygiene',
        title: 'Hand Hygiene Protocol',
        description: 'Proper hand washing and sanitization procedures',
        category: 'infection_control',
        estimatedTime: 3,
        complianceRequired: true,
        priority: 'standard'
      },
      {
        id: 'sop_patient_intake',
        title: 'Patient Intake Process',
        description: 'Standard patient registration and initial assessment',
        category: 'patient_care',
        estimatedTime: 20,
        complianceRequired: true,
        priority: 'standard'
      },
      {
        id: 'sop_emergency_response',
        title: 'Medical Emergency Response',
        description: 'Code blue and emergency response procedures',
        category: 'emergency',
        estimatedTime: 5,
        complianceRequired: true,
        priority: 'emergency'
      }
    ],
    general: [
      {
        id: 'sop_general_safety',
        title: 'Workplace Safety Checklist',
        description: 'Daily safety inspection and hazard identification',
        category: 'safety',
        estimatedTime: 10,
        complianceRequired: true,
        priority: 'standard'
      },
      {
        id: 'sop_quality_check',
        title: 'Quality Control Process',
        description: 'Standard quality assurance and documentation',
        category: 'quality',
        estimatedTime: 15,
        complianceRequired: false,
        priority: 'standard'
      }
    ]
  };

  return baseSOPs[industryType] || baseSOPs.general;
}