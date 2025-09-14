/**
 * Mobile Analytics Page
 * Sprint 3 Story 2: PWA & Mobile Analytics
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MobileLayout from '../../components/mobile/MobileLayout';
import MobileAnalyticsDashboard from '../../components/mobile/MobileAnalyticsDashboard';
import PWAInstaller from '../../components/mobile/PWAInstaller';
import useMobileOptimization from '../../hooks/useMobileOptimization';

export default function MobileAnalyticsPage() {
  const router = useRouter();
  const { isMobile } = useMobileOptimization();

  const [organization, setOrganization] = useState(null);
  const [userRole, setUserRole] = useState('supervisor');
  const [showPWAInstaller, setShowPWAInstaller] = useState(false);

  // Mock organization and user data (would come from auth context in production)
  useEffect(() => {
    const mockOrg = {
      id: 'org_demo_hospitality',
      name: 'Demo Hotel Paradise',
      industry_type: 'hospitality',
      plan: 'premium'
    };
    setOrganization(mockOrg);

    // Check if PWA installer should be shown
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone;

    if (!isStandalone && isMobile) {
      setShowPWAInstaller(true);
    }
  }, [isMobile]);

  // Redirect to desktop if not mobile
  useEffect(() => {
    if (!isMobile) {
      router.push('/dashboard/analytics');
    }
  }, [isMobile, router]);

  const handleNavigation = (path, page) => {
    router.push(path);
  };

  const handlePWAInstall = () => {
    console.log('PWA installed successfully');
    setShowPWAInstaller(false);
  };

  const handlePWADismiss = () => {
    console.log('PWA installation dismissed');
    setShowPWAInstaller(false);
  };

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Mobile Analytics
          </h1>
          <p className="text-gray-600 mb-6">
            This analytics dashboard is optimized for mobile devices.
          </p>
          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            View Desktop Analytics
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <MobileLayout
        organization={organization}
        currentPage="analytics"
        onNavigate={handleNavigation}
      >
        <MobileAnalyticsDashboard
          organization={organization}
          userRole={userRole}
          timeRange="24h"
        />
      </MobileLayout>

      {/* PWA Installation Prompt */}
      {showPWAInstaller && (
        <PWAInstaller
          organization={organization}
          onInstall={handlePWAInstall}
          onDismiss={handlePWADismiss}
        />
      )}
    </>
  );
}