import React from 'react'

// Mobile-optimized loading skeletons with minimal animation for performance
export const MobileLoadingSkeleton = ({ className = "", height = "h-4" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${height} ${className}`}>
    <div className="h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
  </div>
)

export const ReportLoadingSkeleton = () => (
  <div className="card max-w-4xl mx-auto">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
        <div className="flex-1">
          <MobileLoadingSkeleton height="h-6" className="mb-2 w-3/4" />
          <MobileLoadingSkeleton height="h-4" className="w-1/2" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-4">
        <MobileLoadingSkeleton height="h-4" />
        <MobileLoadingSkeleton height="h-4" className="w-5/6" />
        <MobileLoadingSkeleton height="h-4" className="w-4/6" />
        
        <div className="mt-8">
          <MobileLoadingSkeleton height="h-6" className="w-2/3 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <MobileLoadingSkeleton height="h-4" className="mb-2" />
              <MobileLoadingSkeleton height="h-4" className="w-3/4" />
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <MobileLoadingSkeleton height="h-4" className="mb-2" />
              <MobileLoadingSkeleton height="h-4" className="w-3/4" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Button skeletons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <MobileLoadingSkeleton height="h-10" className="w-full sm:w-32" />
        <MobileLoadingSkeleton height="h-10" className="w-full sm:w-32" />
      </div>
    </div>
  </div>
)

export const AuthModalLoadingSkeleton = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl max-w-md w-full p-6">
      <div className="animate-pulse">
        {/* Header */}
        <div className="text-center mb-6">
          <MobileLoadingSkeleton height="h-8" className="w-2/3 mx-auto mb-2" />
          <MobileLoadingSkeleton height="h-4" className="w-3/4 mx-auto" />
        </div>
        
        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <MobileLoadingSkeleton height="h-4" className="w-1/4 mb-2" />
            <MobileLoadingSkeleton height="h-10" />
          </div>
          <div>
            <MobileLoadingSkeleton height="h-4" className="w-1/4 mb-2" />
            <MobileLoadingSkeleton height="h-10" />
          </div>
          
          {/* Submit button */}
          <MobileLoadingSkeleton height="h-10" className="mt-6" />
        </div>
      </div>
    </div>
  </div>
)

export const SavedReportsLoadingSkeleton = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <MobileLoadingSkeleton height="h-6" className="w-1/3" />
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <MobileLoadingSkeleton height="h-5" className="w-2/3" />
                <MobileLoadingSkeleton height="h-4" className="w-16" />
              </div>
              <MobileLoadingSkeleton height="h-4" className="w-full mb-2" />
              <MobileLoadingSkeleton height="h-4" className="w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const ProcessingLoadingSkeleton = ({ isHospoDojo = false, message = "Processing..." }) => (
  <div className="text-center py-8 sm:py-10 lg:py-12">
    <div className="relative mb-4 sm:mb-6">
      {/* Mobile-optimized loading animation */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full mx-auto animate-bounce" 
           style={{ 
             background: isHospoDojo 
               ? 'linear-gradient(135deg, #42551C 0%, #1C1C1C 100%)' 
               : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
             boxShadow: isHospoDojo ? '0 4px 20px rgba(66, 85, 28, 0.4)' : '0 4px 20px rgba(37, 99, 235, 0.4)'
           }}>
        <div className="w-full h-full rounded-full border-2 border-white border-opacity-30 animate-pulse"></div>
      </div>
      
      {/* Hospo-Dojo specific animation ring */}
      {isHospoDojo && (
        <div className="absolute inset-0 w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-full mx-auto border border-opacity-20 animate-ping" 
             style={{ borderColor: '#42551C' }}></div>
      )}
    </div>
    
    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4 tracking-wide">
      {message}
    </h2>
    
    {/* Progress dots */}
    <div className="flex items-center justify-center space-x-1 mt-4">
      <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
)

// Add the shimmer keyframe animation to globals.css
export const shimmerCSS = `
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`