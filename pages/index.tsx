import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LandingPage from '../components/LandingPage';
import HospoDojoBrandedLanding from '../components/brands/HospoDojoBrandedLanding';
import ProcessAuditApp from '../components/ProcessAuditApp';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

export default function Home() {
  const router = useRouter();
  const [organization, setOrganization] = useState<string | null>(null);
  const [showApp, setShowApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get authentication state
  const { user, loading: authLoading, isLoaded } = useUnifiedAuth();

  useEffect(() => {
    // Detect organization from hostname (domain-based routing)
    let orgFromHostname = null;
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('hospo-dojo')) {
        orgFromHostname = 'hospo-dojo';
      }
    }
    
    // Check for organization cookie or subdomain  
    const orgFromCookie = document.cookie.includes('organization=hospo-dojo') 
      ? 'hospo-dojo' 
      : null;
    
    // Fallback to query parameter for local development
    const orgFromQuery = router.query.org === 'hospo-dojo' 
      ? 'hospo-dojo' 
      : null;

    // Priority: hostname > cookie > query parameter
    const detectedOrg = orgFromHostname || orgFromCookie || orgFromQuery;
    setOrganization(detectedOrg);
    
    console.log('Domain detection:', {
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      detectedOrg,
      source: orgFromHostname ? 'hostname' : orgFromCookie ? 'cookie' : orgFromQuery ? 'query' : 'none'
    });
  }, [router.query]);

  // Access control logic - check if user has access via parameter or authentication
  useEffect(() => {
    // Wait for auth to load
    if (authLoading || !isLoaded) {
      setIsLoading(true);
      return;
    }

    // Check if user has access via URL parameter or is authenticated
    const hasAccess = router.query.access === 'granted' || user;
    
    setShowApp(hasAccess);
    setIsLoading(false);
    
    console.log('Access control check:', {
      accessParam: router.query.access,
      hasUser: !!user,
      hasAccess,
      willShowApp: hasAccess
    });
  }, [router.query.access, user, authLoading, isLoaded]);

  // Loading state while checking authentication and access
  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading ProcessAudit AI...</div>
      </div>
    );
  }

  // For Hospo Dojo, render branded landing (only if no direct app access)
  if (organization === 'hospo-dojo' && !showApp) {
    return <HospoDojoBrandedLanding />;
  }

  // Show main app if user has access via parameter or authentication
  if (showApp) {
    return <ProcessAuditApp isDemoMode={!user} organization={organization} />;
  }

  // Default ProcessAudit AI landing page
  return <LandingPage />;
}