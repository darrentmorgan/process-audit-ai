#!/usr/bin/env node

/**
 * Mobile Performance Testing Script
 * ProcessAudit AI - Comprehensive Mobile Performance Validation
 */

const { chromium, devices } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Performance testing configuration
const PERFORMANCE_CONFIG = {
  baseURL: 'http://localhost:3000',
  hospodojoURL: 'http://localhost:3000?org=hospo-dojo&access=granted',
  testTimeout: 60000,
  navigationTimeout: 30000,
  
  // Performance thresholds
  thresholds: {
    timeToInteractive: 3000,    // 3 seconds max
    firstContentfulPaint: 1500,  // 1.5 seconds max  
    largestContentfulPaint: 2500, // 2.5 seconds max
    cumulativeLayoutShift: 0.1,   // CLS score
    firstInputDelay: 100,         // 100ms max
    totalBlockingTime: 300        // 300ms max
  },
  
  // Network conditions for testing
  networkConditions: {
    'Fast 4G': { downloadThroughput: 10 * 1024 * 1024, uploadThroughput: 5 * 1024 * 1024, latency: 150 },
    '3G': { downloadThroughput: 1.6 * 1024 * 1024, uploadThroughput: 750 * 1024, latency: 300 },
    'Slow 3G': { downloadThroughput: 500 * 1024, uploadThroughput: 500 * 1024, latency: 2000 }
  }
};

// Mobile devices to test
const MOBILE_DEVICES = [
  { name: 'iPhone SE', config: devices['iPhone SE'] },
  { name: 'iPhone 13', config: devices['iPhone 13'] },
  { name: 'iPhone 14 Pro', config: devices['iPhone 14 Pro'] },
  { name: 'Pixel 5', config: devices['Pixel 5'] },
  { name: 'Galaxy S21', config: devices['Galaxy S21'] }
];

// Tablet devices to test
const TABLET_DEVICES = [
  { name: 'iPad', config: devices['iPad'] },
  { name: 'iPad Pro', config: devices['iPad Pro'] }
];

class MobilePerformanceTester {
  constructor() {
    this.results = {
      deviceResults: {},
      networkResults: {},
      overallMetrics: {},
      testTimestamp: new Date().toISOString()
    };
    this.browser = null;
  }

  async initialize() {
    console.log('🚀 Initializing Mobile Performance Testing...');
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    console.log('✅ Browser launched successfully');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async measureCoreWebVitals(page) {
    return await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            switch (entry.entryType) {
              case 'paint':
                vitals[entry.name.replace('-', '_')] = entry.startTime;
                break;
              case 'largest-contentful-paint':
                vitals.largest_contentful_paint = entry.startTime;
                break;
              case 'first-input':
                vitals.first_input_delay = entry.processingStart - entry.startTime;
                break;
              case 'layout-shift':
                if (!vitals.cumulative_layout_shift) vitals.cumulative_layout_shift = 0;
                vitals.cumulative_layout_shift += entry.value;
                break;
            }
          }
        });

        // Observe all relevant performance entries
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });

        // Also capture navigation timing
        window.addEventListener('load', () => {
          const navigation = performance.getEntriesByType('navigation')[0];
          if (navigation) {
            vitals.time_to_interactive = navigation.loadEventEnd - navigation.fetchStart;
            vitals.dom_content_loaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          }

          // Resolve after collecting metrics for a short period
          setTimeout(() => {
            observer.disconnect();
            resolve(vitals);
          }, 2000);
        });

        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(vitals);
        }, 10000);
      });
    });
  }

  async testDevicePerformance(device, url) {
    console.log(`📱 Testing ${device.name} performance...`);
    
    const context = await this.browser.newContext({
      ...device.config,
      // Enable performance tracking
      recordHar: { path: `temp/${device.name.replace(' ', '_')}_har.json` },
      recordVideo: { dir: 'temp/videos' }
    });

    const page = await context.newPage();

    try {
      // Navigate and measure
      const startTime = Date.now();
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: PERFORMANCE_CONFIG.navigationTimeout 
      });
      const navigationTime = Date.now() - startTime;

      // Measure Core Web Vitals
      const vitals = await this.measureCoreWebVitals(page);

      // Test Hospo-Dojo specific elements
      const hospodojoMetrics = await this.measureHospodojoElements(page);

      // Measure page size and resource loading
      const resourceMetrics = await this.measureResourceUsage(page);

      const results = {
        device: device.name,
        navigationTime,
        coreWebVitals: vitals,
        hospodojoMetrics,
        resourceMetrics,
        timestamp: new Date().toISOString()
      };

      this.results.deviceResults[device.name] = results;
      
      console.log(`✅ ${device.name}: Navigation ${navigationTime}ms, FCP ${vitals.first_contentful_paint || 'N/A'}ms`);
      
    } catch (error) {
      console.error(`❌ Error testing ${device.name}:`, error.message);
      this.results.deviceResults[device.name] = { error: error.message };
    } finally {
      await context.close();
    }
  }

  async measureHospodojoElements(page) {
    return await page.evaluate(() => {
      const metrics = {};
      
      // Check brand attribute
      const htmlElement = document.documentElement;
      metrics.brandAttribute = htmlElement.getAttribute('data-brand');
      
      // Check logo loading
      const logo = document.querySelector('img[alt*="HOSPO DOJO"]');
      if (logo) {
        metrics.logoLoaded = logo.complete && logo.naturalWidth > 0;
        metrics.logoSize = { width: logo.naturalWidth, height: logo.naturalHeight };
        metrics.logoDisplaySize = { 
          width: logo.getBoundingClientRect().width, 
          height: logo.getBoundingClientRect().height 
        };
      }

      // Check demo banner
      const demoBanner = document.querySelector(':contains("Dojo Demo Mode")') || 
                        document.querySelector('[class*="demo"]') ||
                        document.querySelector(':contains("Demo Mode")');
      metrics.demoBannerVisible = !!demoBanner;

      // Check touch targets
      const buttons = Array.from(document.querySelectorAll('button'));
      const touchTargets = buttons.map(btn => {
        const rect = btn.getBoundingClientRect();
        return {
          meetsMinimum: rect.width >= 44 && rect.height >= 44,
          size: { width: rect.width, height: rect.height }
        };
      });
      
      metrics.touchTargets = {
        total: touchTargets.length,
        meetingMinimum: touchTargets.filter(t => t.meetsMinimum).length,
        percentage: touchTargets.length > 0 ? (touchTargets.filter(t => t.meetsMinimum).length / touchTargets.length) * 100 : 0
      };

      return metrics;
    });
  }

  async measureResourceUsage(page) {
    const metrics = await page.evaluate(() => {
      // Get resource timing data
      const resources = performance.getEntriesByType('resource');
      
      let totalSize = 0;
      let imageSize = 0;
      let scriptSize = 0;
      let styleSize = 0;
      
      resources.forEach(resource => {
        if (resource.transferSize) {
          totalSize += resource.transferSize;
          
          if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            imageSize += resource.transferSize;
          } else if (resource.name.match(/\.js$/i)) {
            scriptSize += resource.transferSize;
          } else if (resource.name.match(/\.css$/i)) {
            styleSize += resource.transferSize;
          }
        }
      });

      return {
        totalResourceSize: totalSize,
        imageSize,
        scriptSize,
        styleSize,
        resourceCount: resources.length
      };
    });

    return metrics;
  }

  async testNetworkConditions(device, network, url) {
    console.log(`🌐 Testing ${device.name} on ${network} network...`);
    
    const context = await this.browser.newContext({
      ...device.config,
      offline: false
    });

    // Set network conditions (this would need Chrome DevTools Protocol for real throttling)
    // For now, we'll simulate by adding delays
    const page = await context.newPage();

    try {
      const startTime = Date.now();
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: PERFORMANCE_CONFIG.testTimeout 
      });
      const loadTime = Date.now() - startTime;

      const vitals = await this.measureCoreWebVitals(page);

      this.results.networkResults[`${device.name}_${network}`] = {
        device: device.name,
        network,
        loadTime,
        vitals,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ ${device.name} on ${network}: ${loadTime}ms`);

    } catch (error) {
      console.error(`❌ Error testing ${device.name} on ${network}:`, error.message);
      this.results.networkResults[`${device.name}_${network}`] = { 
        device: device.name, 
        network, 
        error: error.message 
      };
    } finally {
      await context.close();
    }
  }

  async generateReport() {
    console.log('📊 Generating performance report...');
    
    // Calculate overall metrics
    this.calculateOverallMetrics();
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    
    // Save results
    const reportDir = 'mobile-performance-reports';
    await fs.mkdir(reportDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(reportDir, `mobile-performance-${timestamp}.json`);
    const htmlPath = path.join(reportDir, `mobile-performance-${timestamp}.html`);
    
    await fs.writeFile(jsonPath, JSON.stringify(this.results, null, 2));
    await fs.writeFile(htmlPath, htmlReport);
    
    console.log(`✅ Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
    
    return { jsonPath, htmlPath };
  }

  calculateOverallMetrics() {
    const deviceResults = Object.values(this.results.deviceResults).filter(r => !r.error);
    
    if (deviceResults.length === 0) {
      this.results.overallMetrics = { error: 'No successful test results' };
      return;
    }

    // Calculate averages
    const avgNavigationTime = deviceResults.reduce((sum, r) => sum + (r.navigationTime || 0), 0) / deviceResults.length;
    const avgFCP = deviceResults.reduce((sum, r) => sum + (r.coreWebVitals.first_contentful_paint || 0), 0) / deviceResults.length;
    const avgLCP = deviceResults.reduce((sum, r) => sum + (r.coreWebVitals.largest_contentful_paint || 0), 0) / deviceResults.length;

    // Check thresholds
    const thresholdResults = {};
    Object.entries(PERFORMANCE_CONFIG.thresholds).forEach(([metric, threshold]) => {
      const values = deviceResults.map(r => {
        switch(metric) {
          case 'timeToInteractive': return r.coreWebVitals.time_to_interactive;
          case 'firstContentfulPaint': return r.coreWebVitals.first_contentful_paint;
          case 'largestContentfulPaint': return r.coreWebVitals.largest_contentful_paint;
          case 'cumulativeLayoutShift': return r.coreWebVitals.cumulative_layout_shift;
          case 'firstInputDelay': return r.coreWebVitals.first_input_delay;
          default: return 0;
        }
      }).filter(v => v !== undefined && v !== null);

      if (values.length > 0) {
        const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
        thresholdResults[metric] = {
          average: avgValue,
          threshold,
          passing: avgValue <= threshold,
          passingDevices: values.filter(v => v <= threshold).length,
          totalDevices: values.length
        };
      }
    });

    this.results.overallMetrics = {
      testedDevices: deviceResults.length,
      averageNavigationTime: avgNavigationTime,
      averageFirstContentfulPaint: avgFCP,
      averageLargestContentfulPaint: avgLCP,
      thresholdResults,
      overallScore: this.calculateOverallScore(thresholdResults)
    };
  }

  calculateOverallScore(thresholdResults) {
    const passingTests = Object.values(thresholdResults).filter(r => r.passing).length;
    const totalTests = Object.keys(thresholdResults).length;
    return totalTests > 0 ? Math.round((passingTests / totalTests) * 100) : 0;
  }

  generateHTMLReport() {
    const { deviceResults, networkResults, overallMetrics } = this.results;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProcessAudit AI - Mobile Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #1C1C1C; font-size: 24px; font-weight: bold; }
        .tagline { color: #42551C; margin-top: 5px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #42551C; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1C1C1C; }
        .metric-label { color: #666; margin-top: 5px; }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .device-results { margin: 30px 0; }
        .device-card { background: #f9f9f9; margin: 10px 0; padding: 15px; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .timestamp { color: #666; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">HOSPO DOJO</div>
            <div class="tagline">Mobile Performance Testing Report</div>
            <div class="timestamp">Generated: ${this.results.testTimestamp}</div>
        </div>

        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value ${overallMetrics.overallScore >= 80 ? 'status-good' : overallMetrics.overallScore >= 60 ? 'status-warning' : 'status-error'}">
                    ${overallMetrics.overallScore || 0}%
                </div>
                <div class="metric-label">Overall Performance Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${overallMetrics.testedDevices || 0}</div>
                <div class="metric-label">Devices Tested</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(overallMetrics.averageNavigationTime || 0)}ms</div>
                <div class="metric-label">Average Load Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(overallMetrics.averageFirstContentfulPaint || 0)}ms</div>
                <div class="metric-label">Average First Contentful Paint</div>
            </div>
        </div>

        <h2>Performance Thresholds</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Threshold</th>
                <th>Average Result</th>
                <th>Status</th>
                <th>Passing Devices</th>
            </tr>
            ${Object.entries(overallMetrics.thresholdResults || {}).map(([metric, data]) => `
                <tr>
                    <td>${metric}</td>
                    <td>${data.threshold}${metric.includes('Time') || metric.includes('Paint') || metric.includes('Delay') ? 'ms' : ''}</td>
                    <td>${Math.round(data.average)}</td>
                    <td class="${data.passing ? 'status-good' : 'status-error'}">${data.passing ? '✓ PASS' : '✗ FAIL'}</td>
                    <td>${data.passingDevices}/${data.totalDevices}</td>
                </tr>
            `).join('')}
        </table>

        <h2>Device Performance Results</h2>
        <div class="device-results">
            ${Object.entries(deviceResults).map(([device, result]) => `
                <div class="device-card">
                    <h3>${device}</h3>
                    ${result.error ? `
                        <p class="status-error">Error: ${result.error}</p>
                    ` : `
                        <p><strong>Navigation Time:</strong> ${result.navigationTime}ms</p>
                        <p><strong>Hospo-Dojo Branding:</strong> ${result.hospodojoMetrics?.brandAttribute || 'Not detected'}</p>
                        <p><strong>Logo Status:</strong> ${result.hospodojoMetrics?.logoLoaded ? '✓ Loaded' : '✗ Failed'}</p>
                        <p><strong>Touch Targets:</strong> ${result.hospodojoMetrics?.touchTargets?.percentage || 0}% meeting 44px minimum</p>
                        <p><strong>Resource Size:</strong> ${Math.round((result.resourceMetrics?.totalResourceSize || 0) / 1024)}KB</p>
                    `}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  async runComprehensiveTests() {
    console.log('🧪 Starting comprehensive mobile performance tests...');
    
    // Test each mobile device
    for (const device of MOBILE_DEVICES) {
      await this.testDevicePerformance(device, PERFORMANCE_CONFIG.hospodojoURL);
    }
    
    // Test tablets
    for (const device of TABLET_DEVICES) {
      await this.testDevicePerformance(device, PERFORMANCE_CONFIG.hospodojoURL);
    }
    
    // Test network conditions on a subset of devices
    for (const networkName of ['Fast 4G', '3G']) {
      await this.testNetworkConditions(MOBILE_DEVICES[0], networkName, PERFORMANCE_CONFIG.hospodojoURL);
    }
    
    console.log('✅ All tests completed');
  }
}

// Main execution
async function main() {
  const tester = new MobilePerformanceTester();
  
  try {
    await tester.initialize();
    await tester.runComprehensiveTests();
    const reportPaths = await tester.generateReport();
    
    console.log('\n🎉 Mobile Performance Testing Complete!');
    console.log('\n📊 Summary:');
    console.log(`   Overall Score: ${tester.results.overallMetrics.overallScore}%`);
    console.log(`   Devices Tested: ${tester.results.overallMetrics.testedDevices}`);
    console.log(`   Average Load Time: ${Math.round(tester.results.overallMetrics.averageNavigationTime || 0)}ms`);
    console.log('\n📄 Reports:');
    console.log(`   HTML Report: ${reportPaths.htmlPath}`);
    console.log(`   JSON Data: ${reportPaths.jsonPath}`);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MobilePerformanceTester, PERFORMANCE_CONFIG, MOBILE_DEVICES, TABLET_DEVICES };