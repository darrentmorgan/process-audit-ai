import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LandingPage from '../components/LandingPage';
import HospoDojoBrandedLanding from '../components/brands/HospoDojoBrandedLanding';

export default function Home() {
  const router = useRouter();
  const [organization, setOrganization] = useState<string | null>(null);

  useEffect(() => {
    // Check for organization cookie or subdomain
    const orgFromCookie = document.cookie.includes('organization=hospo-dojo') 
      ? 'hospo-dojo' 
      : null;
    
    // Fallback to query parameter for local development
    const orgFromQuery = router.query.org === 'hospo-dojo' 
      ? 'hospo-dojo' 
      : null;

    setOrganization(orgFromCookie || orgFromQuery);
  }, [router.query]);

  // For Hospo Dojo, render branded landing
  if (organization === 'hospo-dojo') {
    return <HospoDojoBrandedLanding />;
  }

  // Default ProcessAudit AI landing
  return <LandingPage />;
}