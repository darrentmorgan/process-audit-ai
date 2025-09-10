import { Page, TestInfo } from '@playwright/test';
import { faker } from '@faker-js/faker';

export class TestHelpers {
  /**
   * Generate a random test user for authentication
   */
  static generateTestUser() {
    return {
      email: faker.internet.email(),
      password: `Test${faker.internet.password({ length: 16 })}!`,
      organization: `ProcessAudit-Test-${faker.company.name()}`
    };
  }

  /**
   * Take a screenshot with automatic naming
   * @param page Playwright page object
   * @param name Optional custom name for the screenshot
   */
  static async takeScreenshot(page: Page, name?: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = name 
      ? `${name}-${timestamp}.png` 
      : `screenshot-${timestamp}.png`;
    
    await page.screenshot({ 
      path: `test-results/screenshots/${screenshotName}`,
      fullPage: true 
    });
  }

  /**
   * Log comprehensive test metadata
   * @param testInfo Playwright test info object
   */
  static logTestMetadata(testInfo: TestInfo) {
    console.log(`
      Test Metadata:
      - Title: ${testInfo.title}
      - File: ${testInfo.file}
      - Line: ${testInfo.line}
      - Duration: ${testInfo.duration}ms
      - Status: ${testInfo.status}
    `);
  }

  /**
   * Simulate network conditions for resilience testing
   * @param page Playwright page object
   * @param condition Network condition to simulate
   */
  static async simulateNetworkConditions(page: Page, condition: 'slow' | 'offline' = 'slow') {
    const cdp = await page.context().newCDPSession(page);
    
    switch (condition) {
      case 'slow':
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 500, // 500ms latency
          downloadThroughput: 500 * 1024, // 500 Kbps
          uploadThroughput: 256 * 1024 // 256 Kbps
        });
        break;
      case 'offline':
        await cdp.send('Network.emulateNetworkConditions', {
          offline: true,
          latency: -1,
          downloadThroughput: -1,
          uploadThroughput: -1
        });
        break;
    }
  }

  /**
   * Generate mock file for testing uploads
   * @param fileType Type of file to generate
   * @param size Size of the file in bytes
   */
  static generateMockFile(fileType: 'pdf' | 'docx' | 'txt', size: number): Buffer {
    const content = faker.lorem.paragraphs(10);
    const buffer = Buffer.from(content, 'utf-8');
    
    // Pad the buffer to desired size
    if (buffer.length < size) {
      const paddingBuffer = Buffer.alloc(size - buffer.length, 0);
      return Buffer.concat([buffer, paddingBuffer]);
    }
    
    return buffer.slice(0, size);
  }
}