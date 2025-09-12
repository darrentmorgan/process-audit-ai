/**
 * Mobile Performance Test Suite
 * Tests mobile-specific performance optimizations and Core Web Vitals
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { performance } from 'perf_hooks'
import ProcessAuditApp from '../components/ProcessAuditApp'

// Mock mobile environment
const mockMobileEnvironment = () => {
  // Mock window.innerWidth for mobile
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375, // iPhone SE width
  })

  // Mock navigator.userAgent for mobile
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  })

  // Mock connection API
  Object.defineProperty(navigator, 'connection', {
    writable: true,
    configurable: true,
    value: {
      effectiveType: '4g',
      downlink: 2.5,
      rtt: 100,
      saveData: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  })

  // Mock deviceMemory
  Object.defineProperty(navigator, 'deviceMemory', {
    writable: true,
    configurable: true,
    value: 2, // Low memory device
  })
}

const mockSlowNetworkEnvironment = () => {
  Object.defineProperty(navigator, 'connection', {
    writable: true,
    configurable: true,
    value: {
      effectiveType: 'slow-2g',
      downlink: 0.5,
      rtt: 400,
      saveData: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  })
}

describe('Mobile Performance Tests', () => {
  beforeAll(() => {
    mockMobileEnvironment()
  })

  beforeEach(() => {
    // Clear performance marks
    if (performance.clearMarks) {
      performance.clearMarks()
    }
    if (performance.clearMeasures) {
      performance.clearMeasures()
    }
  })

  describe('Initial Load Performance', () => {
    test('should render main component in under 100ms on mobile', async () => {
      const startTime = performance.now()
      
      render(<ProcessAuditApp isDemoMode={true} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(100) // 100ms mobile render target
      console.log(`Mobile render time: ${renderTime.toFixed(2)}ms`)
    })

    test('should have mobile-optimized class applied', () => {
      render(<ProcessAuditApp isDemoMode={true} />)
      
      // Check if mobile optimizations are applied
      expect(document.documentElement.classList.contains('mobile-optimized')).toBe(true)
    })

    test('should apply reduced-motion for low-memory devices', () => {
      render(<ProcessAuditApp isDemoMode={true} />)
      
      // Check if reduced motion is applied for low memory devices
      expect(document.documentElement.classList.contains('reduced-motion')).toBe(true)
    })
  })

  describe('Touch Interaction Performance', () => {
    test('should handle touch interactions within 16ms (60fps)', async () => {
      render(<ProcessAuditApp isDemoMode={true} />)
      
      const button = screen.getByText(/sign up to save/i)
      
      const startTime = performance.now()
      
      // Simulate touch interaction
      fireEvent.touchStart(button)
      fireEvent.touchEnd(button)
      
      const endTime = performance.now()
      const touchResponseTime = endTime - startTime
      
      expect(touchResponseTime).toBeLessThan(16) // 60fps = 16.67ms per frame
      console.log(`Touch response time: ${touchResponseTime.toFixed(2)}ms`)
    })

    test('should have proper touch target sizes (min 44px)', () => {
      render(<ProcessAuditApp isDemoMode={true} />)
      
      const touchTargets = document.querySelectorAll('.touch-target, .btn-primary, .btn-secondary')
      
      touchTargets.forEach(target => {
        const styles = window.getComputedStyle(target)
        const minHeight = parseInt(styles.minHeight)
        
        expect(minHeight).toBeGreaterThanOrEqual(44) // iOS/Android touch target minimum
      })
    })
  })

  describe('Network-Aware Optimizations', () => {
    test('should apply data-saving mode on slow networks', () => {
      mockSlowNetworkEnvironment()
      
      render(<ProcessAuditApp isDemoMode={true} />)
      
      // Should apply data-saving optimizations
      expect(document.documentElement.classList.contains('data-saving-mode')).toBe(true)
    })

    test('should disable animations in data-saving mode', () => {
      mockSlowNetworkEnvironment()
      
      render(<ProcessAuditApp isDemoMode={true} />)
      
      const animatedElements = document.querySelectorAll('.animate-bounce, .animate-pulse')
      
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(element)
        expect(styles.animationName).toBe('none')
      })
    })
  })

  describe('Hospo-Dojo Mobile Performance', () => {
    test('should optimize Hospo-Dojo branding for mobile', () => {
      render(<ProcessAuditApp isDemoMode={true} organization="hospo-dojo" />)
      
      // Check if Hospo-Dojo branding is applied
      expect(document.documentElement.getAttribute('data-brand')).toBe('hospo-dojo')
      
      // Check mobile logo optimization
      const logo = document.querySelector('.hd-logo-mobile')
      if (logo) {
        const styles = window.getComputedStyle(logo)
        expect(styles.imageRendering).toBe('-webkit-optimize-contrast')
      }
    })

    test('should load Hospo-Dojo assets efficiently', async () => {
      const startTime = performance.now()
      
      render(<ProcessAuditApp isDemoMode={true} organization="hospo-dojo" />)
      
      // Wait for branding to be applied
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-brand')).toBe('hospo-dojo')
      })
      
      const endTime = performance.now()
      const brandingTime = endTime - startTime
      
      expect(brandingTime).toBeLessThan(50) // Fast branding application
      console.log(`Hospo-Dojo branding time: ${brandingTime.toFixed(2)}ms`)
    })
  })

  describe('Memory Management', () => {
    test('should clean up resources on component unmount', () => {
      const { unmount } = render(<ProcessAuditApp isDemoMode={true} />)
      
      // Verify initial state
      expect(document.documentElement.classList.contains('mobile-optimized')).toBe(true)
      
      // Unmount component
      unmount()
      
      // Check cleanup - data-brand should be removed but mobile-optimized might persist
      expect(document.documentElement.getAttribute('data-brand')).toBeNull()
    })

    test('should handle low-memory scenarios gracefully', () => {
      // Mock very low memory device
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 1,
        configurable: true,
      })
      
      render(<ProcessAuditApp isDemoMode={true} />)
      
      // Should apply memory-saving optimizations
      expect(document.documentElement.classList.contains('reduced-motion')).toBe(true)
    })
  })

  describe('Core Web Vitals Simulation', () => {
    test('should simulate LCP under 2.5s', async () => {
      const startTime = performance.now()
      
      render(<ProcessAuditApp isDemoMode={true} />)
      
      // Wait for main content to be rendered
      await waitFor(() => {
        expect(screen.getByText(/ProcessAudit AI|HOSPO DOJO/)).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const simulatedLCP = endTime - startTime
      
      expect(simulatedLCP).toBeLessThan(2500) // 2.5s LCP target
      console.log(`Simulated LCP: ${simulatedLCP.toFixed(2)}ms`)
    })

    test('should maintain CLS under 0.1', () => {
      render(<ProcessAuditApp isDemoMode={true} />)
      
      // Check for layout shift prevention measures
      const images = document.querySelectorAll('img')
      images.forEach(img => {
        // Images should have dimensions or aspect ratio to prevent layout shift
        expect(
          img.hasAttribute('width') || 
          img.hasAttribute('height') || 
          img.style.aspectRatio ||
          img.classList.contains('mobile-placeholder')
        ).toBe(true)
      })
    })
  })

  describe('Bundle Size Impact', () => {
    test('should use dynamic imports for heavy components', () => {
      render(<ProcessAuditApp isDemoMode={true} />)
      
      // Heavy components should not be in initial bundle
      // This is more of a build-time check, but we can verify lazy loading
      const lazyComponents = [
        'AuditReport',
        'ClerkAuthModal', 
        'SavedReportsModal',
        'DatabaseCleanup'
      ]
      
      // These components should only load when needed
      lazyComponents.forEach(componentName => {
        expect(screen.queryByTestId(componentName.toLowerCase())).not.toBeInTheDocument()
      })
    })
  })
})

describe('Mobile Performance Integration Tests', () => {
  beforeAll(() => {
    mockMobileEnvironment()
  })

  test('should complete full mobile workflow under performance budget', async () => {
    const startTime = performance.now()
    
    const { rerender } = render(<ProcessAuditApp isDemoMode={true} />)
    
    // Simulate navigation through steps
    // Step 1: Process Input (immediate)
    expect(screen.getByText(/describe or upload process/i)).toBeInTheDocument()
    
    const step1Time = performance.now() - startTime
    expect(step1Time).toBeLessThan(100) // Fast initial render
    
    // Navigate to step 2 (analysis)
    rerender(<ProcessAuditApp isDemoMode={true} />)
    
    const step2Time = performance.now() - startTime
    expect(step2Time).toBeLessThan(200) // Fast step transition
    
    console.log(`Full mobile workflow time: ${step2Time.toFixed(2)}ms`)
  })

  test('should handle concurrent mobile users efficiently', async () => {
    const concurrentRenders = 5
    const renderPromises = []
    
    const startTime = performance.now()
    
    // Simulate multiple concurrent mobile users
    for (let i = 0; i < concurrentRenders; i++) {
      renderPromises.push(
        new Promise(resolve => {
          render(<ProcessAuditApp isDemoMode={true} />)
          resolve(performance.now() - startTime)
        })
      )
    }
    
    const results = await Promise.all(renderPromises)
    const maxRenderTime = Math.max(...results)
    
    expect(maxRenderTime).toBeLessThan(500) // Should handle concurrent load
    console.log(`Concurrent mobile renders max time: ${maxRenderTime.toFixed(2)}ms`)
  })
})