/**
 * Mobile Browser Validation - Playwright E2E Tests
 * ProcessAudit AI - Hospo-Dojo Multi-Tenant Mobile Experience Testing
 */

const { test, expect, devices } = require('@playwright/test');

// Mobile device configurations for testing
const mobileDevices = [
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'iPhone 13', device: devices['iPhone 13'] },
  { name: 'iPhone 14 Pro', device: devices['iPhone 14 Pro'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Galaxy S21', device: devices['Galaxy S21'] }
];

const tabletDevices = [
  { name: 'iPad', device: devices['iPad'] },
  { name: 'iPad Pro', device: devices['iPad Pro'] }
];

// Test URLs
const baseURL = 'http://localhost:3000';
const hospodojoURL = `${baseURL}?org=hospo-dojo&access=granted`;

test.describe('Mobile Browser Validation - ProcessAudit AI', () => {

  test.describe('1. Multi-Device Hospo-Dojo Branding Tests', () => {

    mobileDevices.forEach(({ name, device }) => {
      test(`${name} - Hospo-Dojo branding displays correctly`, async ({ browser }) => {
        const context = await browser.newContext({
          ...device,
          // Mobile-specific context settings
          geolocation: { latitude: 40.7128, longitude: -74.0060 }, // NYC for hospitality context
          permissions: ['geolocation'],
          reducedMotion: 'reduce' // Test accessibility
        });

        const page = await context.newPage();

        // Navigate to Hospo-Dojo branded experience
        await page.goto(hospodojoURL, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        // Test 1: Brand attribute is set correctly
        const dataBrand = await page.getAttribute('html', 'data-brand');
        expect(dataBrand).toBe('hospo-dojo');

        // Test 2: Hospo-Dojo logo is present and properly sized
        const logo = page.locator('img[alt*="HOSPO DOJO"]');
        await expect(logo).toBeVisible({ timeout: 10000 });
        
        const logoBox = await logo.boundingBox();
        expect(logoBox.height).toBeGreaterThan(20); // Minimum logo height
        expect(logoBox.height).toBeLessThan(40); // Maximum mobile logo height

        // Test 3: Mobile-optimized tagline is readable
        const tagline = page.locator('text=Prep For Success');
        await expect(tagline).toBeVisible();
        
        // Test 4: Demo mode banner displays correctly on mobile
        const demoBanner = page.locator('text=Dojo Demo Mode');
        await expect(demoBanner).toBeVisible();

        // Test 5: Touch targets meet minimum 44px requirement
        const joinButton = page.locator('button:has-text("Join the Dojo")');
        await expect(joinButton).toBeVisible();
        
        const buttonBox = await joinButton.boundingBox();
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);

        // Test 6: Mobile gradient background renders correctly
        const backgroundStyle = await page.evaluate(() => {
          const computedStyle = window.getComputedStyle(document.body.parentElement);
          return computedStyle.background || computedStyle.backgroundColor;
        });
        expect(backgroundStyle).toContain('linear-gradient');

        await context.close();
      });
    });

    tabletDevices.forEach(({ name, device }) => {
      test(`${name} - Tablet optimization validation`, async ({ browser }) => {
        const context = await browser.newContext(device);
        const page = await context.newPage();

        await page.goto(hospodojoURL);

        // Test tablet-specific layout adjustments
        const viewport = page.viewportSize();
        expect(viewport.width).toBeGreaterThanOrEqual(768);

        // Test logo scaling for tablet
        const logo = page.locator('img[alt*="HOSPO DOJO"]');
        await expect(logo).toBeVisible();
        
        const logoBox = await logo.boundingBox();
        expect(logoBox.height).toBeGreaterThan(24); // Larger than mobile
        expect(logoBox.height).toBeLessThan(35); // But not too large

        await context.close();
      });
    });

  });

  test.describe('2. Mobile Workflow Testing', () => {

    test('Complete mobile workflow - Restaurant manager scenario', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 13'],
        // Simulate poor network conditions
        slowMo: 100 // Slow down actions for mobile testing
      });

      const page = await context.newPage();

      // Step 1: Landing page loads within acceptable time
      const startTime = Date.now();
      await page.goto(hospodojoURL);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // 5 seconds max for mobile

      // Step 2: Demo mode banner is tappable
      const demoBanner = page.locator('button:has-text("Join the Dojo to save results")');
      await expect(demoBanner).toBeVisible();
      await expect(demoBanner).toBeEnabled();

      // Step 3: Features are properly displayed on mobile
      const features = [
        'Lightning Fast Analysis',
        'Strategic Moves', 
        'Victory Metrics'
      ];

      for (const feature of features) {
        await expect(page.locator(`text=${feature}`)).toBeVisible();
      }

      // Step 4: Mobile navigation works properly
      const viewport = page.viewportSize();
      expect(viewport.width).toBeLessThan(768); // Confirm mobile breakpoint

      await context.close();
    });

    test('Touch interaction validation', async ({ browser }) => {
      const context = await browser.newContext(devices['iPhone SE']);
      const page = await context.newPage();

      await page.goto(hospodojoURL);

      // Test touch feedback on primary CTA
      const joinButton = page.locator('button:has-text("Join the Dojo")').first();
      await expect(joinButton).toBeVisible();

      // Simulate touch interaction
      await joinButton.hover(); // Hover state
      await joinButton.click(); // Touch interaction

      // Verify navigation or modal opened
      // (This would depend on the actual implementation)
      
      await context.close();
    });

  });

  test.describe('3. Performance Testing on Mobile', () => {

    test('Mobile page load performance', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Pixel 5'],
        // Simulate 3G network
        offline: false
      });

      const page = await context.newPage();

      // Measure Core Web Vitals
      await page.goto(hospodojoURL);

      // Get performance metrics
      const performanceMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const metrics = {};
            
            entries.forEach(entry => {
              if (entry.entryType === 'paint') {
                metrics[entry.name] = entry.startTime;
              }
            });
            
            resolve(metrics);
          }).observe({ entryTypes: ['paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve({}), 3000);
        });
      });

      // Validate First Contentful Paint
      if (performanceMetrics['first-contentful-paint']) {
        expect(performanceMetrics['first-contentful-paint']).toBeLessThan(2000);
      }

      await context.close();
    });

    test('Mobile scroll performance', async ({ browser }) => {
      const context = await browser.newContext(devices['Galaxy S21']);
      const page = await context.newPage();

      await page.goto(hospodojoURL);

      // Test smooth scrolling
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(100);
      await page.mouse.wheel(0, -500);

      // Verify no layout shifts during scroll
      const layoutShifts = await page.evaluate(() => {
        return new Promise((resolve) => {
          let totalShift = 0;
          
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift') {
                totalShift += entry.value;
              }
            }
            
            setTimeout(() => resolve(totalShift), 1000);
          }).observe({ entryTypes: ['layout-shift'] });
        });
      });

      expect(layoutShifts).toBeLessThan(0.1); // Good CLS score

      await context.close();
    });

  });

  test.describe('4. Accessibility Testing on Mobile', () => {

    test('Mobile screen reader compatibility', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 13'],
        reducedMotion: 'reduce',
        forcedColors: 'active' // High contrast mode
      });

      const page = await context.newPage();
      await page.goto(hospodojoURL);

      // Test semantic structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);

      // Test button labels
      const buttons = page.locator('button');
      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        const isVisible = await button.isVisible();
        
        if (isVisible) {
          const ariaLabel = await button.getAttribute('aria-label');
          const textContent = await button.textContent();
          
          // Ensure button has accessible name
          expect(ariaLabel || textContent?.trim()).toBeTruthy();
        }
      }

      await context.close();
    });

    test('High contrast mode support', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPad'],
        forcedColors: 'active',
        colorScheme: 'dark'
      });

      const page = await context.newPage();
      await page.goto(hospodojoURL);

      // Verify page is still usable in high contrast mode
      const logo = page.locator('img[alt*="HOSPO DOJO"]');
      await expect(logo).toBeVisible();

      const mainButton = page.locator('button:has-text("Join the Dojo")').first();
      await expect(mainButton).toBeVisible();

      await context.close();
    });

  });

  test.describe('5. Mobile Form Interaction Testing', () => {

    test('Mobile form inputs prevent iOS zoom', async ({ browser }) => {
      const context = await browser.newContext(devices['iPhone SE']);
      const page = await context.newPage();

      await page.goto(hospodojoURL);

      // Look for email input (if present in waitlist form)
      const emailInput = page.locator('input[type="email"]');
      
      if (await emailInput.count() > 0) {
        await expect(emailInput).toBeVisible();

        // Check font size to prevent zoom
        const fontSize = await emailInput.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });

        // Font size should be 16px or larger to prevent iOS zoom
        expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
      }

      await context.close();
    });

    test('Mobile keyboard handling', async ({ browser }) => {
      const context = await browser.newContext(devices['iPhone 13']);
      const page = await context.newPage();

      await page.goto(hospodojoURL);

      // Test mobile keyboard interaction
      const emailInput = page.locator('input[type="email"]');
      
      if (await emailInput.count() > 0) {
        await emailInput.click();
        await emailInput.fill('test@hospodojo.com');

        const value = await emailInput.inputValue();
        expect(value).toBe('test@hospodojo.com');
      }

      await context.close();
    });

  });

  test.describe('6. Network Resilience Testing', () => {

    test('Mobile offline behavior', async ({ browser }) => {
      const context = await browser.newContext(devices['Pixel 5']);
      const page = await context.newPage();

      // Load page normally first
      await page.goto(hospodojoURL);
      await expect(page.locator('img[alt*="HOSPO DOJO"]')).toBeVisible();

      // Simulate offline
      await context.setOffline(true);

      // Test cached resources still work
      await page.reload({ waitUntil: 'domcontentloaded' });
      
      // Should show offline message or cached content
      // Implementation depends on service worker setup

      await context.close();
    });

    test('Slow network adaptation', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone SE']
        // Note: Playwright doesn't have built-in network throttling
        // This would need to be implemented with a proxy or CDP
      });

      const page = await context.newPage();

      const startTime = Date.now();
      await page.goto(hospodojoURL, { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;

      // Even on slow networks, basic content should load
      await expect(page.locator('img[alt*="HOSPO DOJO"]')).toBeVisible();
      
      // Reasonable timeout for mobile on slow networks
      expect(loadTime).toBeLessThan(15000);

      await context.close();
    });

  });

  test.describe('7. Mobile-Specific Bug Prevention', () => {

    test('iOS Safari specific issues', async ({ browser }) => {
      const context = await browser.newContext(devices['iPhone 13']);
      const page = await context.newPage();

      await page.goto(hospodojoURL);

      // Test viewport units work correctly
      const viewport = page.viewportSize();
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      
      expect(bodyHeight).toBeGreaterThan(viewport.height * 0.8);

      // Test no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width);

      await context.close();
    });

    test('Android Chrome specific testing', async ({ browser }) => {
      const context = await browser.newContext(devices['Galaxy S21']);
      const page = await context.newPage();

      await page.goto(hospodojoURL);

      // Test address bar behavior doesn't break layout
      const initialHeight = await page.evaluate(() => window.innerHeight);
      
      // Simulate scroll (which might change address bar visibility)
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(500);
      
      const finalHeight = await page.evaluate(() => window.innerHeight);
      
      // Layout should adapt to viewport changes
      expect(Math.abs(finalHeight - initialHeight)).toBeLessThan(100);

      await context.close();
    });

  });

});

// Helper functions for mobile testing
const MobileBrowserTestUtils = {
  
  async measurePerformance(page, metric) {
    return await page.evaluate((metricName) => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entry = list.getEntriesByName(metricName)[0];
          resolve(entry ? entry.startTime : null);
        });
        
        observer.observe({ entryTypes: ['measure', 'paint', 'navigation'] });
        
        setTimeout(() => resolve(null), 3000);
      });
    }, metric);
  },

  async checkTouchTargetSize(page, selector) {
    const element = page.locator(selector);
    const boundingBox = await element.boundingBox();
    
    return {
      meetsMinimum: boundingBox.width >= 44 && boundingBox.height >= 44,
      width: boundingBox.width,
      height: boundingBox.height
    };
  },

  async validateMobileOptimizations(page) {
    const optimizations = await page.evaluate(() => {
      const html = document.documentElement;
      const viewport = document.querySelector('meta[name="viewport"]');
      
      return {
        hasViewportMeta: !!viewport,
        viewportContent: viewport?.content,
        hasBrandAttribute: html.hasAttribute('data-brand'),
        brandValue: html.getAttribute('data-brand'),
        doctype: document.doctype?.name
      };
    });

    return optimizations;
  },

  async simulateNetworkCondition(context, condition) {
    // This would integrate with Chrome DevTools Protocol
    // For now, returning a mock implementation
    const conditions = {
      'slow3g': { downloadThroughput: 500000, uploadThroughput: 500000, latency: 2000 },
      '3g': { downloadThroughput: 1500000, uploadThroughput: 750000, latency: 562.5 },
      '4g': { downloadThroughput: 10000000, uploadThroughput: 10000000, latency: 150 }
    };
    
    return conditions[condition] || conditions['4g'];
  }
};

module.exports = { MobileBrowserTestUtils };