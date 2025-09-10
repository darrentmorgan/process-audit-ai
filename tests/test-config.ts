// Test Configuration for ProcessAudit AI E2E Tests

export interface TestCredentials {
  email: string;
  password: string;
  testOrgId?: string;
}

export interface TestConfig {
  credentials: TestCredentials;
  baseURL: string;
  timeouts: {
    navigation: number;
    action: number;
    test: number;
  };
  pdf: {
    downloadTimeout: number;
    minFileSize: number;
    maxFileSize: number;
    expectedFormats: string[];
  };
  api: {
    endpoints: {
      generatePDF: string;
      previewPDF: string;
      analyzeProcess: string;
    };
  };
}

export const TEST_USER: TestCredentials = {
  email: process.env.TEST_EMAIL || 'test.user@processaudit.ai',
  password: process.env.TEST_PASSWORD || 'TestPassword123!',
  testOrgId: process.env.TEST_ORG_ID || 'test-org-001'
};

export const TEST_CONFIG: TestConfig = {
  credentials: TEST_USER,
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  timeouts: {
    navigation: 30000, // 30 seconds
    action: 15000,     // 15 seconds  
    test: 120000       // 2 minutes
  },
  pdf: {
    downloadTimeout: 10000, // 10 seconds
    minFileSize: 1000,      // 1KB minimum
    maxFileSize: 50000,     // 50KB maximum
    expectedFormats: ['application/pdf']
  },
  api: {
    endpoints: {
      generatePDF: '/api/generate-pdf',
      previewPDF: '/api/pdf-preview',
      analyzeProcess: '/api/analyze-process'
    }
  }
};

// Test data fixtures
export const TEST_PROCESS_DATA = {
  description: 'Customer support ticket management process that handles incoming customer inquiries through email, chat, and phone. The process involves ticket categorization, assignment to appropriate teams, resolution tracking, and customer follow-up.',
  industry: 'Technology',
  department: 'Customer Support',
  processOwner: 'Sarah Johnson',
  expectedVolume: 'High (100+ tickets/day)',
  currentChallenges: 'Manual ticket routing, inconsistent response times, lack of automation'
};

export const EXPECTED_PDF_STRUCTURE = {
  auditReport: {
    minPages: 4,
    requiredSections: ['Executive Summary', 'Process Analysis', 'Automation Opportunities', 'Implementation Roadmap'],
    expectedFileSize: { min: 10000, max: 30000 }
  },
  executiveSummary: {
    minPages: 2,
    requiredSections: ['Overview', 'Key Metrics', 'Recommendations'],
    expectedFileSize: { min: 8000, max: 20000 }
  },
  sopDocument: {
    minPages: 3,
    requiredSections: ['Purpose', 'Scope', 'Procedures', 'Responsibilities'],
    expectedFileSize: { min: 8000, max: 25000 }
  }
};

export default TEST_CONFIG;