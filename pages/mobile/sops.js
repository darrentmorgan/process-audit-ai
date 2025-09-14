/**
 * Mobile SOPs Page
 * Sprint 3: Mobile Experience MVP - Mobile SOP Interface
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MobileLayout from '../../components/mobile/MobileLayout';
import MobileSOPList from '../../components/mobile/MobileSOPList';
import MobileSOPViewer from '../../components/mobile/MobileSOPViewer';
import MobileComplianceTracker from '../../components/mobile/MobileComplianceTracker';
import useMobileOptimization from '../../hooks/useMobileOptimization';

export default function MobileSOPsPage() {
  const router = useRouter();
  const { isMobile } = useMobileOptimization();

  const [currentView, setCurrentView] = useState('list'); // 'list', 'viewer', 'compliance'
  const [selectedSOP, setSelectedSOP] = useState(null);
  const [organization, setOrganization] = useState(null);

  // Mock organization data (would come from auth context in production)
  useEffect(() => {
    const mockOrg = {
      id: 'org_demo_hospitality',
      name: 'Demo Hotel Paradise',
      industry_type: 'hospitality',
      plan: 'premium'
    };
    setOrganization(mockOrg);
  }, []);

  // Redirect to desktop if not mobile
  useEffect(() => {
    if (!isMobile) {
      router.push('/');
    }
  }, [isMobile, router]);

  const handleSOPSelect = (sop) => {
    setSelectedSOP(sop);
    setCurrentView('viewer');
  };

  const handleSOPComplete = (completionData) => {
    console.log('SOP completed:', completionData);

    if (completionData.complianceRequired || completionData.photos > 0) {
      setCurrentView('compliance');
    } else {
      // Simple completion, go back to list
      setCurrentView('list');
      setSelectedSOP(null);
    }
  };

  const handleComplianceComplete = (complianceData) => {
    console.log('Compliance documented:', complianceData);

    // Show success message
    alert('Compliance documentation saved successfully!');

    // Return to SOP list
    setCurrentView('list');
    setSelectedSOP(null);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedSOP(null);
  };

  const handleNavigation = (path, page) => {
    router.push(path);
  };

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Mobile Experience
          </h1>
          <p className="text-gray-600 mb-6">
            This page is optimized for mobile devices.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Return to Desktop Version
          </button>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout
      organization={organization}
      currentPage="sops"
      onNavigate={handleNavigation}
    >
      {currentView === 'list' && (
        <MobileSOPList
          organization={organization}
          onSOPSelect={handleSOPSelect}
          onCreateSOP={() => router.push('/create-sop')}
        />
      )}

      {currentView === 'viewer' && selectedSOP && (
        <MobileSOPViewer
          organization={organization}
          sopData={selectedSOP}
          onComplete={handleSOPComplete}
          onBack={handleBackToList}
        />
      )}

      {currentView === 'compliance' && selectedSOP && (
        <MobileComplianceTracker
          sopTitle={selectedSOP.title}
          organizationId={organization?.id}
          industryType={organization?.industry_type}
          onComplete={handleComplianceComplete}
          onCancel={handleBackToList}
        />
      )}
    </MobileLayout>
  );
}