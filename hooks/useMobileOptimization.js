import { useEffect, useCallback, useMemo, useState } from 'react'

export const useMobileOptimization = () => {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  })
  
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    memory: 4,
    cores: 4
  })

  // Detect mobile device and capabilities
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    
    return window.innerWidth <= 768 || 
           /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }, [])

  // Network-aware optimizations
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Network Information API support
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 50,
          saveData: connection.saveData || false
        })
      }
      
      updateNetworkInfo()
      connection.addEventListener('change', updateNetworkInfo)
      
      return () => {
        connection.removeEventListener('change', updateNetworkInfo)
      }
    }
  }, [])

  // Device capability detection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const deviceMemory = navigator.deviceMemory || 4
    const hardwareConcurrency = navigator.hardwareConcurrency || 4
    
    setDeviceInfo({
      isMobile,
      memory: deviceMemory,
      cores: hardwareConcurrency
    })

    // Apply mobile-specific optimizations
    if (isMobile) {
      document.documentElement.classList.add('mobile-optimized')
      
      // Reduce animations on low-end devices
      if (deviceMemory <= 2) {
        document.documentElement.classList.add('reduced-motion')
        document.documentElement.style.setProperty('--animation-duration', '0.1s')
      }
      
      // Network-based optimizations
      if (networkInfo.effectiveType === 'slow-2g' || networkInfo.saveData) {
        document.documentElement.classList.add('data-saving-mode')
      }
    }

    return () => {
      document.documentElement.classList.remove('mobile-optimized', 'reduced-motion', 'data-saving-mode')
    }
  }, [isMobile, networkInfo])

  // Performance-optimized touch handlers
  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return
    
    // Immediate visual feedback for mobile
    const target = e.currentTarget
    target.style.transform = 'scale(0.95)'
    target.style.transition = 'transform 0.1s ease-out'
  }, [isMobile])

  const handleTouchEnd = useCallback((e) => {
    if (!isMobile) return
    
    const target = e.currentTarget
    setTimeout(() => {
      target.style.transform = 'scale(1)'
    }, 100)
  }, [isMobile])

  // Memory management for mobile
  const requestIdleCallback = useCallback((callback) => {
    if (typeof window === 'undefined') return

    if (window.requestIdleCallback) {
      return window.requestIdleCallback(callback, { timeout: 1000 })
    } else {
      // Fallback for mobile browsers without requestIdleCallback
      return setTimeout(callback, 1)
    }
  }, [])

  // Performance monitoring
  const trackPerformanceMetric = useCallback((metricName, value) => {
    if (typeof window === 'undefined') return

    // Track mobile-specific performance metrics
    if (window.gtag) {
      window.gtag('event', 'mobile_performance', {
        metric_name: metricName,
        value: value,
        device_type: isMobile ? 'mobile' : 'desktop',
        network_type: networkInfo.effectiveType,
        device_memory: deviceInfo.memory
      })
    }
  }, [isMobile, networkInfo, deviceInfo])

  // Adaptive loading strategy
  const shouldLoadHeavyAssets = useMemo(() => {
    // Don't load heavy assets on slow networks or low-memory devices
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.saveData) {
      return false
    }
    
    if (deviceInfo.memory <= 2) {
      return false
    }
    
    return true
  }, [networkInfo, deviceInfo])

  // Mobile-specific viewport utilities
  const getViewportInfo = useCallback(() => {
    if (typeof window === 'undefined') return { width: 375, height: 667 }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      safeAreaTop: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0'),
      safeAreaBottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0')
    }
  }, [])

  return {
    // Device detection
    isMobile,
    deviceInfo,
    networkInfo,
    
    // Performance utilities
    shouldLoadHeavyAssets,
    requestIdleCallback,
    trackPerformanceMetric,
    getViewportInfo,
    
    // Touch interaction handlers
    handleTouchStart,
    handleTouchEnd,
    
    // Mobile-specific flags
    isSlowNetwork: networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g',
    isDataSavingMode: networkInfo.saveData,
    isLowMemoryDevice: deviceInfo.memory <= 2,
    isLowEndDevice: deviceInfo.memory <= 2 && deviceInfo.cores <= 2,
  }
}

export default useMobileOptimization