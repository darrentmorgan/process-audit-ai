/**
 * Mobile SOP Viewer Component
 * Sprint 3: Mobile Experience MVP - Field Operations SOP Access
 *
 * Provides touch-optimized, offline-capable SOP viewing for field staff
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  Download,
  Wifi,
  WifiOff,
  CheckCircle,
  Camera,
  Search,
  BookOpen,
  Shield,
  AlertTriangle
} from 'lucide-react';
import useMobileOptimization from '../../hooks/useMobileOptimization';

export default function MobileSOPViewer({
  organization = null,
  sopData = null,
  onComplete = null,
  onBack = null
}) {
  const {
    isMobile,
    shouldLoadHeavyAssets,
    trackPerformanceMetric,
    isSlowNetwork
  } = useMobileOptimization();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isOffline, setIsOffline] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompliance, setShowCompliance] = useState(false);
  const [photos, setPhotos] = useState([]);

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

  // Industry-specific terminology
  const getIndustryTerminology = useCallback(() => {
    const industryType = organization?.industry_type || 'general';

    const terminology = {
      hospitality: {
        customer: 'guest',
        service: 'guest experience',
        location: 'property',
        staff: 'team member',
        manager: 'supervisor'
      },
      restaurant: {
        customer: 'guest',
        service: 'dining experience',
        location: 'restaurant',
        staff: 'team member',
        manager: 'kitchen manager'
      },
      medical: {
        customer: 'patient',
        service: 'care',
        location: 'facility',
        staff: 'healthcare worker',
        manager: 'charge nurse'
      },
      general: {
        customer: 'customer',
        service: 'service',
        location: 'workplace',
        staff: 'employee',
        manager: 'supervisor'
      }
    };

    return terminology[industryType] || terminology.general;
  }, [organization]);

  // Mobile-optimized SOP parsing
  const parsedSOP = useMemo(() => {
    if (!sopData?.content) return null;

    const terminology = getIndustryTerminology();
    let content = sopData.content;

    // Apply industry-specific terminology
    Object.entries(terminology).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      content = content.replace(regex, value);
    });

    // Parse into mobile-friendly steps
    const sections = content.split(/\n(?=\d+\.|\w+:)/);

    return {
      title: sopData.title || 'Standard Operating Procedure',
      industry: organization?.industry_type || 'general',
      sections: sections.map((section, index) => ({
        id: index,
        content: section.trim(),
        type: section.toLowerCase().includes('safety') ? 'safety' :
              section.toLowerCase().includes('compliance') ? 'compliance' :
              section.toLowerCase().includes('emergency') ? 'emergency' : 'standard'
      })),
      estimatedTime: Math.ceil(sections.length * 2), // 2 minutes per section
      complianceRequired: content.toLowerCase().includes('compliance') ||
                         content.toLowerCase().includes('regulation') ||
                         content.toLowerCase().includes('safety')
    };
  }, [sopData, organization, getIndustryTerminology]);

  // Download SOP for offline access
  const handleDownload = useCallback(async () => {
    if (!sopData) return;

    try {
      trackPerformanceMetric('sop_download_start', Date.now());

      // Store SOP in localStorage for offline access
      const sopCache = {
        id: sopData.id || `sop_${Date.now()}`,
        title: parsedSOP.title,
        content: sopData.content,
        industry: parsedSOP.industry,
        downloadedAt: new Date().toISOString(),
        organizationId: organization?.id
      };

      const existingCache = JSON.parse(localStorage.getItem('offlineSOPs') || '[]');
      const updatedCache = [...existingCache.filter(s => s.id !== sopCache.id), sopCache];

      localStorage.setItem('offlineSOPs', JSON.stringify(updatedCache));
      setIsDownloaded(true);

      trackPerformanceMetric('sop_download_complete', Date.now());

      // Show success feedback
      if (navigator.vibrate) {
        navigator.vibrate(100); // Haptic feedback on mobile
      }

    } catch (error) {
      console.error('Failed to download SOP for offline access:', error);
    }
  }, [sopData, parsedSOP, organization, trackPerformanceMetric]);

  // Mark step as completed
  const handleStepComplete = useCallback((stepIndex) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);

    // Haptic feedback for completion
    if (navigator.vibrate && !newCompleted.has(stepIndex)) {
      navigator.vibrate([50, 50, 50]); // Success pattern
    }
  }, [completedSteps]);

  // Take compliance photo
  const handleTakePhoto = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Camera not available on this device');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Create video element for photo capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const photoData = canvas.toDataURL('image/jpeg', 0.8);

        setPhotos(prev => [...prev, {
          id: Date.now(),
          data: photoData,
          timestamp: new Date().toISOString(),
          step: currentStep
        }]);

        // Stop camera stream
        stream.getTracks().forEach(track => track.stop());
      };

    } catch (error) {
      console.error('Failed to take photo:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }, [currentStep]);

  // Complete entire SOP
  const handleSOPComplete = useCallback(() => {
    const completionData = {
      sopId: sopData?.id,
      organizationId: organization?.id,
      completedSteps: Array.from(completedSteps),
      totalSteps: parsedSOP?.sections?.length || 0,
      completionRate: completedSteps.size / (parsedSOP?.sections?.length || 1),
      photos: photos.length,
      compliancePhotos: photos,
      completedAt: new Date().toISOString(),
      deviceType: isMobile ? 'mobile' : 'desktop',
      offlineCompletion: isOffline
    };

    if (onComplete) {
      onComplete(completionData);
    }

    // Haptic feedback for completion
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]); // Success completion pattern
    }
  }, [sopData, organization, completedSteps, parsedSOP, photos, isOffline, isMobile, onComplete]);

  if (!parsedSOP) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No SOP Available</h2>
          <p className="text-gray-600">Please select an SOP to view on mobile.</p>
        </div>
      </div>
    );
  }

  const currentSection = parsedSOP.sections[currentStep];
  const isStepCompleted = completedSteps.has(currentStep);
  const totalCompleted = completedSteps.size;
  const completionPercentage = Math.round((totalCompleted / parsedSOP.sections.length) * 100);

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 font-medium"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>

          <div className="flex items-center space-x-2">
            {isOffline ? (
              <WifiOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Wifi className="w-5 h-5 text-green-500" />
            )}

            <button
              onClick={handleDownload}
              disabled={isDownloaded}
              className={`p-2 rounded-lg ${
                isDownloaded
                  ? 'bg-green-100 text-green-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowCompliance(!showCompliance)}
              className="p-2 rounded-lg bg-purple-100 text-purple-600"
            >
              <Shield className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              Progress: {totalCompleted} of {parsedSOP.sections.length}
            </span>
            <span className="text-sm text-gray-600">
              {completionPercentage}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* SOP Content */}
      <div className="p-4">
        {/* SOP Title and Meta */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {parsedSOP.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="capitalize">{parsedSOP.industry} Industry</span>
            <span>~{parsedSOP.estimatedTime} min</span>
            {parsedSOP.complianceRequired && (
              <span className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Compliance Required
              </span>
            )}
          </div>
        </div>

        {/* Current Step */}
        {currentSection && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Step {currentStep + 1} of {parsedSOP.sections.length}
              </h2>

              <div className="flex items-center space-x-2">
                {currentSection.type === 'safety' && (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                )}
                {currentSection.type === 'compliance' && (
                  <Shield className="w-5 h-5 text-purple-500" />
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="prose prose-sm max-w-none">
                <div
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: currentSection.content.replace(/\n/g, '<br />')
                  }}
                />
              </div>
            </div>

            {/* Step Actions */}
            <div className="flex flex-col space-y-3">
              {/* Completion Toggle */}
              <button
                onClick={() => handleStepComplete(currentStep)}
                className={`flex items-center justify-center p-4 rounded-xl font-medium transition-all ${
                  isStepCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                }`}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {isStepCompleted ? 'Step Completed' : 'Mark Complete'}
              </button>

              {/* Photo Documentation */}
              {(currentSection.type === 'compliance' || currentSection.type === 'safety') && (
                <button
                  onClick={handleTakePhoto}
                  className="flex items-center justify-center p-4 rounded-xl bg-purple-100 text-purple-700 font-medium"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Document Compliance ({photos.filter(p => p.step === currentStep).length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`flex items-center px-6 py-3 rounded-xl font-medium ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </button>

          {currentStep < parsedSOP.sections.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex items-center px-6 py-3 rounded-xl bg-blue-600 text-white font-medium"
            >
              Next
              <ChevronLeft className="w-5 h-5 ml-1 rotate-180" />
            </button>
          ) : (
            <button
              onClick={handleSOPComplete}
              disabled={completedSteps.size === 0}
              className={`flex items-center px-6 py-3 rounded-xl font-medium ${
                completedSteps.size > 0
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Complete SOP
            </button>
          )}
        </div>

        {/* Step Overview */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">All Steps</h3>
          <div className="space-y-2">
            {parsedSOP.sections.map((section, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  index === currentStep
                    ? 'bg-blue-100 border-2 border-blue-300'
                    : completedSteps.has(index)
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    Step {index + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    {section.type === 'safety' && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                    {section.type === 'compliance' && (
                      <Shield className="w-4 h-4 text-purple-500" />
                    )}
                    {completedSteps.has(index) && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {section.content.substring(0, 100)}...
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Compliance Photos */}
        {photos.length > 0 && (
          <div className="mt-6 bg-purple-50 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 mb-3">
              Compliance Documentation ({photos.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.data}
                    alt={`Compliance photo for step ${photo.step + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                    Step {photo.step + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline Status */}
        {isOffline && (
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center">
              <WifiOff className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <p className="font-medium text-orange-900">Offline Mode</p>
                <p className="text-sm text-orange-700">
                  Changes will sync when connection returns
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {isOffline ? 'Offline' : 'Online'} • {totalCompleted}/{parsedSOP.sections.length} Complete
          </div>

          <div className="flex items-center space-x-2">
            {parsedSOP.complianceRequired && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Compliance Required
              </span>
            )}

            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
              {parsedSOP.industry}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}