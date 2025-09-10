import { defineConfig, devices } from '@playwright/test';
import { ProcessAuditTestConfiguration } from './types/testing';

// Comprehensive test configuration
const processAuditTestConfig: ProcessAuditTestConfiguration = {
  authentication: {
    user: {
      email: 'test-user@processaudit.ai',
      password: 'TestPassword123!',
      organization: 'ProcessAudit-TestOrg'
    }
  },
  fileUploads: [
    {
      fileName: 'sample-process.pdf',
      fileType: 'pdf',
      fileSize: 1024 * 100, // 100KB
      expectedProcessingTime: 500 // ms
    },
    {
      fileName: 'sample-sop.docx',
      fileType: 'docx',
      fileSize: 1024 * 200, // 200KB
      expectedProcessingTime: 750 // ms
    }
  ],
  aiAnalysis: [
    {
      inputType: 'file',
      expectedQuestionCount: 8,
      expectedAnalysisDuration: 5000 // 5 seconds
    }
  ],
  pdfGeneration: [
    {
      reportType: 'audit',
      expectedPDFSize: { min: 50 * 1024, max: 2 * 1024 * 1024 }, // 50KB - 2MB
      requiredSections: ['Executive Summary', 'Process Map', 'Opportunities']
    }
  ],
  automationTests: [
    {
      workflowType: 'email',
      expectedNodeCount: 5,
      requiredIntegrations: ['smtp', 'webhook']
    }
  ],
  performanceBenchmarks: {
    maxResponseTime: 3000, // 3 seconds
    concurrentUsers: 10,
    successRate: 99.9
  },
  errorScenarios: [
    {
      scenarioName: 'network-failure',
      simulatedCondition: 'network-failure',
      expectedErrorHandling: 'graceful-fallback'
    }
  ],
  pdfValidation: {
    minPages: 2,
    requiredElements: ['Company Logo', 'Page Numbers', 'Watermark'],
    brandingVerification: {
      logo: true,
      colors: ['#007bff', '#6c757d']
    }
  },
  multiTenant: [
    {
      tenantId: 'processaudit-default',
      brandingVariations: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        logoPath: '/logos/processaudit-default.svg'
      }
    }
  ]
};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000, // 60 seconds
  expect: {
    timeout: 10 * 1000 // 10 seconds for assertions
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],

  // Inject global test configuration
  globalSetup: require.resolve('./tests/global-setup.ts')
});