// Comprehensive Testing Type Definitions for ProcessAudit AI

import { Page, Locator, TestInfo } from '@playwright/test';

// Authentication Context Types
export interface AuthTestContext {
  user: {
    email: string;
    password: string;
    organization?: string;
  };
  authToken?: string;
}

// File Upload Test Scenarios
export interface FileUploadTestCase {
  fileName: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'txt';
  fileSize: number;
  expectedProcessingTime: number;
}

// AI Analysis Test Scenario
export interface AIAnalysisTestCase {
  inputType: 'file' | 'text';
  expectedQuestionCount: number;
  expectedAnalysisDuration: number;
}

// PDF Generation Test Case
export interface PDFGenerationTestCase {
  reportType: 'audit' | 'sop' | 'executive-summary';
  expectedPDFSize: {
    min: number;
    max: number;
  };
  requiredSections: string[];
}

// Automation Generation Test Case
export interface AutomationTestCase {
  workflowType: 'email' | 'crm' | 'data-processing';
  expectedNodeCount: number;
  requiredIntegrations: string[];
}

// Performance Benchmark Interface
export interface PerformanceBenchmark {
  maxResponseTime: number;
  concurrentUsers: number;
  successRate: number;
}

// Error Scenario Test Case
export interface ErrorScenarioTestCase {
  scenarioName: string;
  simulatedCondition: 'network-failure' | 'timeout' | 'auth-error' | 'db-connection';
  expectedErrorHandling: 'graceful-fallback' | 'retry' | 'user-notification';
}

// Comprehensive Test Runner Context
export interface TestRunnerContext {
  page: Page;
  context: {
    auth: AuthTestContext;
    performance: PerformanceBenchmark;
  };
  utils: {
    takeScreenshot: (name: string) => Promise<void>;
    logTestMetadata: (info: TestInfo) => void;
  };
}

// PDF Validation Specifications
export interface PDFValidationSpecs {
  minPages: number;
  requiredElements: string[];
  brandingVerification: {
    logo: boolean;
    colors: string[];
  };
}

// Multi-Tenant Test Configuration
export interface MultiTenantTestConfig {
  tenantId: string;
  brandingVariations: {
    primaryColor: string;
    secondaryColor: string;
    logoPath: string;
  };
}

// Exported Comprehensive Test Configuration
export interface ProcessAuditTestConfiguration {
  authentication: AuthTestContext;
  fileUploads: FileUploadTestCase[];
  aiAnalysis: AIAnalysisTestCase[];
  pdfGeneration: PDFGenerationTestCase[];
  automationTests: AutomationTestCase[];
  performanceBenchmarks: PerformanceBenchmark;
  errorScenarios: ErrorScenarioTestCase[];
  pdfValidation: PDFValidationSpecs;
  multiTenant: MultiTenantTestConfig[];
}