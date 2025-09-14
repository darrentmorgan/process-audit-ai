/**
 * Mobile Compliance Tracker Component
 * Sprint 3: Mobile Experience MVP - Field Compliance Documentation
 *
 * Provides mobile compliance tracking with photo documentation and digital signatures
 */

import { useState, useCallback, useRef } from 'react';
import {
  Camera,
  CheckCircle,
  X,
  Upload,
  FileText,
  Shield,
  Calendar,
  User,
  MapPin,
  Clock
} from 'lucide-react';

export default function MobileComplianceTracker({
  sopTitle = '',
  organizationId = null,
  industryType = 'general',
  onComplete = null,
  onCancel = null
}) {
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState('');
  const [location, setLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signaturePadRef = useRef(null);

  // Get current location for compliance tracking
  const getCurrentLocation = useCallback(async () => {
    try {
      if (!navigator.geolocation) return null;

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            });
          },
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });
    } catch (error) {
      console.warn('Could not get location:', error);
      return null;
    }
  }, []);

  // Take compliance photo
  const handleTakePhoto = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Camera not available on this device');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera for documentation
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      });

      // Create modal for photo capture
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black z-50 flex items-center justify-center';

      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.className = 'w-full h-full object-cover';

      const captureButton = document.createElement('button');
      captureButton.innerHTML = '📷 Capture';
      captureButton.className = 'absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full font-medium';

      const cancelButton = document.createElement('button');
      cancelButton.innerHTML = '✕ Cancel';
      cancelButton.className = 'absolute top-8 right-8 bg-black bg-opacity-50 text-white p-3 rounded-full';

      modal.appendChild(video);
      modal.appendChild(captureButton);
      modal.appendChild(cancelButton);
      document.body.appendChild(modal);

      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };

      cancelButton.onclick = cleanup;

      captureButton.onclick = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const photoData = canvas.toDataURL('image/jpeg', 0.8);

        // Get location if available
        const currentLocation = await getCurrentLocation();

        const photo = {
          id: Date.now(),
          data: photoData,
          timestamp: new Date().toISOString(),
          location: currentLocation,
          filename: `compliance_${Date.now()}.jpg`
        };

        setPhotos(prev => [...prev, photo]);

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }

        cleanup();
      };

    } catch (error) {
      console.error('Failed to take photo:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }, [getCurrentLocation]);

  // Remove photo
  const handleRemovePhoto = useCallback((photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }, []);

  // Digital signature capture
  const handleSignature = useCallback((signatureData) => {
    setSignature(signatureData);
  }, []);

  // Complete compliance documentation
  const handleCompleteCompliance = useCallback(async () => {
    if (photos.length === 0 && !notes.trim() && !signature) {
      alert('Please add at least one photo, notes, or signature for compliance documentation.');
      return;
    }

    setIsSubmitting(true);

    try {
      const complianceData = {
        sopTitle,
        organizationId,
        industryType,
        timestamp: new Date().toISOString(),
        photos: photos.map(photo => ({
          id: photo.id,
          filename: photo.filename,
          timestamp: photo.timestamp,
          location: photo.location,
          // In production, photo.data would be uploaded to storage
          size: photo.data.length
        })),
        notes: notes.trim(),
        signature: !!signature,
        location: location || (photos[0]?.location),
        deviceType: 'mobile',
        complianceOfficer: 'Current User', // Would get from auth context
        completionMethod: 'mobile_app'
      };

      // Store compliance data locally for offline support
      const complianceRecords = JSON.parse(localStorage.getItem('complianceRecords') || '[]');
      complianceRecords.push(complianceData);
      localStorage.setItem('complianceRecords', JSON.stringify(complianceRecords));

      // In production, sync to backend when online
      if (navigator.onLine) {
        // await syncComplianceData(complianceData);
      }

      if (onComplete) {
        onComplete(complianceData);
      }

      // Success haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }

    } catch (error) {
      console.error('Failed to save compliance data:', error);
      alert('Failed to save compliance documentation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [photos, notes, signature, sopTitle, organizationId, industryType, location, onComplete]);

  // Get industry-specific compliance requirements
  const getComplianceRequirements = () => {
    const requirements = {
      hospitality: [
        'Photo documentation required for housekeeping quality',
        'Digital signature for room inspection completion',
        'Location verification for maintenance tasks'
      ],
      restaurant: [
        'Photo evidence required for food safety compliance',
        'Temperature logs must be documented with photos',
        'Digital signature required for health inspection readiness'
      ],
      medical: [
        'Photo documentation required for infection control measures',
        'Digital signature for clinical procedure completion',
        'Location tracking for mobile care delivery'
      ],
      general: [
        'Photo documentation for quality verification',
        'Digital signature for procedure completion',
        'Notes required for any deviations or issues'
      ]
    };

    return requirements[industryType] || requirements.general;
  };

  const complianceRequirements = getComplianceRequirements();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-purple-600 mr-2" />
            <h1 className="text-lg font-semibold text-gray-900">
              Compliance Documentation
            </h1>
          </div>

          <button
            onClick={onCancel}
            className="p-2 rounded-lg bg-gray-100 text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-2">
          {sopTitle}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {/* Compliance Requirements */}
        <div className="mb-6 bg-purple-50 rounded-xl p-4">
          <h2 className="font-semibold text-purple-900 mb-3">
            Industry Requirements
          </h2>
          <ul className="space-y-2">
            {complianceRequirements.map((requirement, index) => (
              <li key={index} className="flex items-start text-sm text-purple-800">
                <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                {requirement}
              </li>
            ))}
          </ul>
        </div>

        {/* Photo Documentation */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Photo Documentation</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.data}
                  alt={`Compliance photo ${photo.id}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {new Date(photo.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}

            {/* Add Photo Button */}
            <button
              onClick={handleTakePhoto}
              className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Add Photo</span>
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Compliance Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any compliance notes, observations, or issues..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Digital Signature */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Digital Signature</h2>
          <div className="border border-gray-300 rounded-xl p-4">
            {signature ? (
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-700 font-medium">Signature Captured</p>
                <button
                  onClick={() => setSignature('')}
                  className="text-xs text-blue-600 mt-1"
                >
                  Clear Signature
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">
                  Tap to add digital signature
                </p>
                <button
                  onClick={() => {
                    const sig = prompt('Enter your name for digital signature:');
                    if (sig) setSignature(sig);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Add Signature
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Completion Summary */}
        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Completion Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Photos:</span>
              <span className="font-medium">{photos.length} documented</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Notes:</span>
              <span className="font-medium">{notes.trim() ? 'Added' : 'None'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Signature:</span>
              <span className="font-medium">{signature ? 'Captured' : 'Required'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Timestamp:</span>
              <span className="font-medium">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleCompleteCompliance}
            disabled={isSubmitting || (!photos.length && !notes.trim())}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              isSubmitting || (!photos.length && !notes.trim())
                ? 'bg-gray-100 text-gray-400'
                : 'bg-green-600 text-white'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Complete Compliance
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}