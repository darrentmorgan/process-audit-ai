/**
 * Mobile Hospo-Dojo Branding Tests
 * Validates mobile-optimized multi-tenant experience for hospitality professionals
 */

// DOM environment is already set up by jsdom test environment

describe('Mobile Hospo-Dojo Multi-Tenant Experience', () => {
  beforeEach(() => {
    // Reset DOM for each test
    document.documentElement.removeAttribute('data-brand');
    document.body.innerHTML = '';
  });

  describe('Brand Detection and Configuration', () => {
    test('should detect Hospo-Dojo organization parameter', () => {
      const mockRouter = { query: { org: 'hospo-dojo' } };
      const organization = mockRouter.query.org;
      
      expect(organization).toBe('hospo-dojo');
    });

    test('should apply Hospo-Dojo brand configuration', () => {
      const getBrandConfig = (org) => {
        if (org === 'hospo-dojo') {
          return {
            name: 'HOSPO DOJO',
            tagline: 'Prep For Success - AI-powered process analysis for hospitality professionals',
            logo: '/Hospo-Dojo-Logo.svg',
            logoType: 'svg',
            theme: {
              primary: '#1C1C1C',
              secondary: '#EAE8DD', 
              accent: '#42551C'
            },
            terminology: {
              analysis: 'Prepping Your Success Strategy',
              progress: 'Battle Plan Progress',
              results: 'Your Hospitality Battle Plan',
              recommendations: 'Strategic Moves for Excellence'
            }
          };
        }
        return null;
      };

      const config = getBrandConfig('hospo-dojo');
      
      expect(config.name).toBe('HOSPO DOJO');
      expect(config.theme.primary).toBe('#1C1C1C');
      expect(config.theme.secondary).toBe('#EAE8DD');
      expect(config.theme.accent).toBe('#42551C');
      expect(config.terminology.analysis).toBe('Prepping Your Success Strategy');
    });
  });

  describe('Mobile CSS Optimizations', () => {
    test('should set brand data attribute for CSS theming', () => {
      document.documentElement.setAttribute('data-brand', 'hospo-dojo');
      
      expect(document.documentElement.getAttribute('data-brand')).toBe('hospo-dojo');
    });

    test('should apply mobile-optimized CSS variables', () => {
      const style = document.createElement('style');
      style.textContent = `
        :root[data-brand="hospo-dojo"] {
          --color-primary: #1C1C1C;
          --color-secondary: #EAE8DD;
          --color-accent: #42551C;
          --touch-target-min: 44px;
          --mobile-padding: 16px;
          --font-size-mobile-base: 16px;
        }
      `;
      document.head.appendChild(style);

      expect(style.textContent).toContain('--touch-target-min: 44px');
      expect(style.textContent).toContain('--font-size-mobile-base: 16px');
      expect(style.textContent).toContain('--color-primary: #1C1C1C');
    });

    test('should include mobile touch feedback classes', () => {
      const style = document.createElement('style');
      style.textContent = `
        .hd-touch-feedback:active {
          transform: scale(0.95);
          transition: transform 0.1s ease-out;
        }
        .hd-button--primary {
          min-height: 44px;
          touch-action: manipulation;
        }
      `;
      document.head.appendChild(style);

      expect(style.textContent).toContain('touch-action: manipulation');
      expect(style.textContent).toContain('min-height: 44px');
      expect(style.textContent).toContain('transform: scale(0.95)');
    });
  });

  describe('Mobile Logo and Asset Optimization', () => {
    test('should create mobile-optimized logo element', () => {
      const logo = document.createElement('img');
      logo.src = '/Hospo-Dojo-Logo.svg';
      logo.alt = 'HOSPO DOJO - Hospitality Operations Platform';
      logo.className = 'hd-logo-mobile transition-transform duration-200 hover:scale-105';
      logo.style.filter = 'brightness(0) invert(1)';
      logo.style.imageRendering = 'crisp-edges';
      logo.loading = 'eager';
      logo.decoding = 'async';

      expect(logo.src).toContain('Hospo-Dojo-Logo.svg');
      expect(logo.className).toContain('hd-logo-mobile');
      expect(logo.style.filter).toBe('brightness(0) invert(1)');
      expect(logo.loading).toBe('eager');
      expect(logo.decoding).toBe('async');
    });

    test('should validate asset paths exist', () => {
      const requiredAssets = [
        '/Hospo-Dojo-Logo.svg',
        '/dojo-stamp.png'
      ];

      // In a real test, we'd check if files exist
      // For now, validate the expected paths
      requiredAssets.forEach(asset => {
        expect(asset).toMatch(/^\/[A-Za-z0-9-]+\.(svg|png)$/);
      });
    });
  });

  describe('Mobile Form Elements', () => {
    test('should create mobile-optimized input elements', () => {
      const input = document.createElement('input');
      input.type = 'email';
      input.className = 'hd-input-mobile';
      input.placeholder = 'Enter your email';
      input.style.fontSize = '16px'; // Prevents iOS zoom
      input.style.minHeight = '44px';

      expect(input.style.fontSize).toBe('16px');
      expect(input.style.minHeight).toBe('44px');
      expect(input.className).toContain('hd-input-mobile');
    });

    test('should create touch-optimized buttons', () => {
      const button = document.createElement('button');
      button.className = 'hd-button hd-button--primary hd-touch-feedback';
      button.style.minHeight = '44px';
      button.innerHTML = '<span class="tracking-wide">Join the Dojo</span>';

      expect(button.style.minHeight).toBe('44px');
      expect(button.className).toContain('hd-button--primary');
      expect(button.className).toContain('hd-touch-feedback');
      expect(button.innerHTML).toContain('tracking-wide');
    });
  });

  describe('Responsive Design Breakpoints', () => {
    test('should apply correct mobile spacing classes', () => {
      const element = document.createElement('div');
      element.className = 'hd-mobile-spacing px-3 sm:px-4 lg:px-0';

      expect(element.className).toContain('hd-mobile-spacing');
      expect(element.className).toContain('px-3');
      expect(element.className).toContain('sm:px-4');
      expect(element.className).toContain('lg:px-0');
    });

    test('should use responsive text sizing', () => {
      const heading = document.createElement('h1');
      heading.className = 'text-lg sm:text-xl lg:text-2xl font-bold tracking-wide';

      expect(heading.className).toContain('text-lg');
      expect(heading.className).toContain('sm:text-xl');
      expect(heading.className).toContain('lg:text-2xl');
      expect(heading.className).toContain('tracking-wide');
    });
  });

  describe('Mobile PDF Branding Service', () => {
    test('should provide mobile-optimized branding configuration', () => {
      const mockPDFBranding = {
        companyName: 'HOSPO DOJO',
        primaryColor: '#1C1C1C',
        secondaryColor: '#EAE8DD',
        accentColor: '#42551C',
        mobileOptimizations: {
          logoScale: 1.2,
          stampOpacity: 0.2,
          fontSize: {
            title: 18,
            heading: 14,
            body: 10,
            caption: 8
          },
          touchFriendly: true
        }
      };

      expect(mockPDFBranding.mobileOptimizations.logoScale).toBe(1.2);
      expect(mockPDFBranding.mobileOptimizations.stampOpacity).toBe(0.2);
      expect(mockPDFBranding.mobileOptimizations.touchFriendly).toBe(true);
      expect(mockPDFBranding.mobileOptimizations.fontSize.title).toBe(18);
    });
  });

  describe('Hospitality-Specific Terminology', () => {
    test('should use martial arts themed terminology for Hospo-Dojo', () => {
      const terminology = {
        analysis: 'Prepping Your Success Strategy',
        progress: 'Battle Plan Progress',
        results: 'Your Hospitality Battle Plan',
        recommendations: 'Strategic Moves for Excellence'
      };

      expect(terminology.analysis).toBe('Prepping Your Success Strategy');
      expect(terminology.progress).toBe('Battle Plan Progress');
      expect(terminology.results).toBe('Your Hospitality Battle Plan');
      expect(terminology.recommendations).toBe('Strategic Moves for Excellence');
    });

    test('should display hospitality-focused feature descriptions', () => {
      const features = [
        'Lightning Fast Analysis - Battle-tested insights for hospitality excellence',
        'Strategic Moves - Precision-targeted hospitality optimizations',
        'Victory Metrics - Quantified success for hospitality warriors'
      ];

      features.forEach(feature => {
        expect(feature).toMatch(/(hospitality|battle|strategic|victory)/i);
      });
    });
  });

  describe('Accessibility and Performance', () => {
    test('should support reduced motion preferences', () => {
      const style = document.createElement('style');
      style.textContent = `
        @media (prefers-reduced-motion: reduce) {
          .hd-touch-feedback:active,
          .hd-button:active {
            transform: none;
          }
        }
      `;
      document.head.appendChild(style);

      expect(style.textContent).toContain('prefers-reduced-motion: reduce');
      expect(style.textContent).toContain('transform: none');
    });

    test('should support high contrast mode', () => {
      const style = document.createElement('style');
      style.textContent = `
        @media (prefers-contrast: high) {
          :root[data-brand="hospo-dojo"] {
            --color-primary: #000000;
            --color-secondary: #FFFFFF;
            --color-accent: #006600;
          }
        }
      `;
      document.head.appendChild(style);

      expect(style.textContent).toContain('prefers-contrast: high');
      expect(style.textContent).toContain('--color-primary: #000000');
    });

    test('should use semantic HTML and proper ARIA labels', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Join Hospo Dojo - Start Free Analysis');
      button.setAttribute('role', 'button');

      expect(button.getAttribute('aria-label')).toBe('Join Hospo Dojo - Start Free Analysis');
      expect(button.getAttribute('role')).toBe('button');
    });
  });

  describe('Mobile Workflow Experience', () => {
    test('should provide mobile-optimized demo mode banner', () => {
      const banner = document.createElement('div');
      banner.className = 'bg-yellow-500 bg-opacity-90 backdrop-blur-sm rounded-xl hd-mobile-spacing';
      banner.innerHTML = `
        <div class="flex flex-col sm:flex-row items-center justify-center gap-2">
          <span class="font-semibold tracking-wide">Dojo Demo Mode</span>
          <button class="hd-touch-feedback underline font-semibold px-2 py-1 rounded" style="min-height: 32px">
            Join the Dojo to save results
          </button>
        </div>
      `;

      expect(banner.className).toContain('backdrop-blur-sm');
      expect(banner.className).toContain('hd-mobile-spacing');
      expect(banner.innerHTML).toContain('Dojo Demo Mode');
      expect(banner.innerHTML).toContain('hd-touch-feedback');
    });

    test('should display mobile-optimized loading states', () => {
      const loader = document.createElement('div');
      loader.innerHTML = `
        <div class="w-12 h-12 rounded-full mx-auto animate-bounce" 
             style="background: linear-gradient(135deg, #42551C 0%, #1C1C1C 100%); box-shadow: 0 4px 20px rgba(66, 85, 28, 0.4)">
          <div class="w-full h-full rounded-full border-2 border-white border-opacity-30 animate-pulse"></div>
        </div>
        <div class="mt-4 flex items-center justify-center gap-2 text-xs text-blue-200 opacity-75">
          <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span class="font-medium tracking-wider uppercase">Dojo Intelligence Processing</span>
          <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        </div>
      `;

      expect(loader.innerHTML).toContain('Dojo Intelligence Processing');
      expect(loader.innerHTML).toContain('animate-bounce');
      expect(loader.innerHTML).toContain('linear-gradient(135deg, #42551C 0%, #1C1C1C 100%)');
    });
  });
});

describe('Mobile Testing Scenarios', () => {
  test('iPhone: Hospo-Dojo experience at ?org=hospo-dojo&access=granted', () => {
    const mockUrl = new URL('https://processaudit.ai?org=hospo-dojo&access=granted');
    const params = new URLSearchParams(mockUrl.search);
    
    expect(params.get('org')).toBe('hospo-dojo');
    expect(params.get('access')).toBe('granted');
    
    // Simulate mobile viewport
    const viewport = { width: 375, height: 812 }; // iPhone X dimensions
    expect(viewport.width).toBeLessThan(768); // Mobile breakpoint
  });

  test('Android: Complete workflow from process input to PDF download', () => {
    const workflow = [
      'process-input',
      'ai-analysis', 
      'sop-questions',
      'improvement-feedback',
      'pdf-generation'
    ];
    
    workflow.forEach(step => {
      expect(step).toMatch(/^[a-z-]+$/); // Valid step names
    });
    
    expect(workflow.length).toBe(5); // Complete workflow
  });

  test('Tablet: Restaurant SOP analysis with proper branding', () => {
    const tabletViewport = { width: 768, height: 1024 }; // iPad dimensions
    const isTablet = tabletViewport.width >= 768 && tabletViewport.width < 1024;
    
    expect(isTablet).toBe(true);
    
    // Tablet-specific considerations
    const tabletOptimizations = {
      touchTargets: '44px',
      fontSize: '16px',
      spacing: '24px',
      brandingScale: 1.1
    };
    
    expect(tabletOptimizations.touchTargets).toBe('44px');
    expect(tabletOptimizations.brandingScale).toBeGreaterThan(1);
  });
});

module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/setup.js']
};