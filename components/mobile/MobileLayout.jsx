/**
 * Mobile Layout Component
 * Sprint 3: Mobile Experience MVP - Mobile-First Layout System
 *
 * Provides mobile-optimized layout with touch navigation and offline support
 */

import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Home,
  BookOpen,
  Settings,
  User,
  Download,
  Wifi,
  WifiOff,
  Bell
} from 'lucide-react';
import useMobileOptimization from '../../hooks/useMobileOptimization';

export default function MobileLayout({
  children,
  organization = null,
  currentPage = 'home',
  onNavigate = null
}) {
  const { isMobile, shouldLoadHeavyAssets } = useMobileOptimization();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineSOPCount, setOfflineSOPCount] = useState(0);

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

  // Load offline SOP count
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('offlineSOPs') || '[]');
      const orgSOPs = cached.filter(sop =>
        !organization?.id || sop.organizationId === organization.id
      );
      setOfflineSOPCount(orgSOPs.length);
    } catch (error) {
      setOfflineSOPCount(0);
    }
  }, [organization]);

  // Navigation items based on organization industry
  const getNavigationItems = () => {
    const industryType = organization?.industry_type || 'general';

    const industryNavigation = {
      hospitality: [
        { id: 'home', label: 'Dashboard', icon: Home, path: '/' },
        { id: 'sops', label: 'Procedures', icon: BookOpen, path: '/mobile/sops' },
        { id: 'inspections', label: 'Inspections', icon: Settings, path: '/mobile/inspections' },
        { id: 'training', label: 'Training', icon: User, path: '/mobile/training' }
      ],
      restaurant: [
        { id: 'home', label: 'Kitchen', icon: Home, path: '/' },
        { id: 'sops', label: 'Procedures', icon: BookOpen, path: '/mobile/sops' },
        { id: 'safety', label: 'Food Safety', icon: Settings, path: '/mobile/safety' },
        { id: 'compliance', label: 'Compliance', icon: User, path: '/mobile/compliance' }
      ],
      medical: [
        { id: 'home', label: 'Patient Care', icon: Home, path: '/' },
        { id: 'sops', label: 'Protocols', icon: BookOpen, path: '/mobile/sops' },
        { id: 'compliance', label: 'Compliance', icon: Settings, path: '/mobile/compliance' },
        { id: 'emergency', label: 'Emergency', icon: User, path: '/mobile/emergency' }
      ],
      general: [
        { id: 'home', label: 'Home', icon: Home, path: '/' },
        { id: 'sops', label: 'SOPs', icon: BookOpen, path: '/mobile/sops' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/mobile/settings' },
        { id: 'profile', label: 'Profile', icon: User, path: '/mobile/profile' }
      ]
    };

    return industryNavigation[industryType] || industryNavigation.general;
  };

  const navigationItems = getNavigationItems();

  // Only apply mobile layout on mobile devices
  if (!isMobile) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg bg-gray-100 text-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900">
              {organization?.name || 'ProcessAudit AI'}
            </h1>
            {organization?.industry_type && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
                {organization.industry_type}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isOffline ? (
              <WifiOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Wifi className="w-5 h-5 text-green-500" />
            )}

            {offlineSOPCount > 0 && (
              <div className="relative">
                <Download className="w-5 h-5 text-blue-600" />
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {offlineSOPCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Offline Status Banner */}
        {isOffline && (
          <div className="bg-orange-100 border-t border-orange-200 px-4 py-2">
            <div className="flex items-center">
              <WifiOff className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-sm text-orange-800">
                Offline Mode - {offlineSOPCount} SOPs Available
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Mobile Navigation Menu (Slide-out) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Navigation
                </h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Organization Info */}
              {organization && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    {organization.name}
                  </h3>
                  <p className="text-sm text-blue-700 capitalize">
                    {organization.industry_type || 'General'} Industry
                  </p>
                  <p className="text-xs text-blue-600 mt-1 capitalize">
                    {organization.plan || 'Free'} Plan
                  </p>
                </div>
              )}

              {/* Navigation Items */}
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate?.(item.path, item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center p-4 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Offline Information */}
              {isOffline && (
                <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                  <div className="flex items-center mb-2">
                    <WifiOff className="w-4 h-4 text-orange-600 mr-2" />
                    <span className="font-medium text-orange-900">Offline Mode</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    {offlineSOPCount} SOPs available offline
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Changes will sync when connection returns
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.path, item.id)}
                className={`flex-1 flex flex-col items-center py-3 px-2 transition-all ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.id === 'sops' && offlineSOPCount > 0 && (
                  <span className="absolute top-1 right-1/4 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {offlineSOPCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}