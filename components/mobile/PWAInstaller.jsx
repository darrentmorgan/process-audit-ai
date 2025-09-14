/**
 * PWA Installer Component
 * Sprint 3 Story 2: PWA Installation and App-like Experience
 *
 * Provides home screen installation prompts and PWA onboarding
 */

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';

export default function PWAInstaller({
  organization = null,
  onInstall = null,
  onDismiss = null
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if PWA is already installed
  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Check if app was previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate ?
      (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24) : null;

    // Show prompt if not installed, not recently dismissed, and device supports PWA
    if (!isStandalone && (!dismissed || daysSinceDismissed > 7)) {
      // Wait a bit before showing prompt (better UX)
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);
    }
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 PWA install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);

      if (onInstall) {
        onInstall();
      }

      // Track installation success
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_installed', {
          event_category: 'PWA',
          event_label: organization?.industry_type || 'general'
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [organization, onInstall]);

  // Handle PWA installation
  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support programmatic install
      showManualInstallInstructions();
      return;
    }

    try {
      // Show the install prompt
      const result = await deferredPrompt.prompt();
      console.log('📱 PWA install prompt result:', result.outcome);

      if (result.outcome === 'accepted') {
        console.log('✅ User accepted PWA installation');
        setShowInstallPrompt(false);
      } else {
        console.log('❌ User dismissed PWA installation');
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA installation failed:', error);
    }
  };

  // Handle install prompt dismissal
  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());

    if (onDismiss) {
      onDismiss();
    }
  };

  // Show manual installation instructions for iOS or unsupported browsers
  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const instructions = isIOS
      ? 'Tap the Share button in Safari, then "Add to Home Screen"'
      : 'Use your browser menu to "Add to Home Screen" or "Install App"';

    alert(`Install ProcessAudit AI:\n\n${instructions}`);
  };

  // Get industry-specific installation benefits
  const getInstallationBenefits = () => {
    const industryType = organization?.industry_type || 'general';

    const benefits = {
      hospitality: [
        'Instant access to housekeeping and guest service SOPs',
        'Offline reliability during property operations',
        'Push notifications for urgent maintenance and compliance alerts'
      ],
      restaurant: [
        'Quick access to food safety and kitchen operation SOPs',
        'Offline functionality during busy service periods',
        'Real-time alerts for health inspections and compliance updates'
      ],
      medical: [
        'Immediate access to patient care and clinical SOPs',
        'Offline access during patient care delivery',
        'Critical alerts for emergency procedures and protocol updates'
      ],
      general: [
        'Instant access to all your organization SOPs',
        'Reliable offline functionality for field operations',
        'Push notifications for important updates and compliance alerts'
      ]
    };

    return benefits[industryType] || benefits.general;
  };

  // Don't show if already installed or permanently dismissed
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  const installationBenefits = getInstallationBenefits();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Install ProcessAudit AI</h3>
              <p className="text-sm text-gray-600">
                Get app-like experience for field operations
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">Benefits:</p>
          <ul className="space-y-1">
            {installationBenefits.slice(0, 2).map((benefit, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleInstall}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Install App
          </button>

          <button
            onClick={handleDismiss}
            className="px-4 py-3 text-gray-600 hover:text-gray-800"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}