#!/usr/bin/env node

/**
 * ProcessAudit AI - Workers Organization Database Integration Testing
 * Phase 2: Test organization-aware database functions
 * 
 * Usage: node test-organization-database.js
 */

import { 
  getJobOrganizationContext,
  getUserOrganizations,
  validateOrganizationAccess,
  createOrganizationAutomationJob,
  getOrganizationAutomationJobs,
  getOrganizationUsageStats,
  updateJobProgress,
  saveAutomation
} from './src/database.js';

// Test configuration
const TEST_CONFIG = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
  },
  testData: {
    // These would be real UUIDs in actual testing
    userId: '12345678-1234-1234-1234-123456789012',
    organizationId: '12345678-1234-1234-1234-123456789013',
    jobId: '12345678-1234-1234-1234-123456789014',
  }
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  
  if (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  testResults.tests.push({ name, passed, error: error?.message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function testEnvironmentSetup() {
  console.log('\n=== TESTING ENVIRONMENT SETUP ===');
  
  // Test 1: Environment variables
  const hasUrl = !!TEST_CONFIG.env.SUPABASE_URL && TEST_CONFIG.env.SUPABASE_URL !== 'https://your-project.supabase.co';
  const hasKey = !!TEST_CONFIG.env.SUPABASE_SERVICE_KEY && TEST_CONFIG.env.SUPABASE_SERVICE_KEY !== 'your-service-key';
  
  logTest('Supabase URL configured', hasUrl);
  logTest('Supabase Service Key configured', hasKey);
  
  if (!hasUrl || !hasKey) {
    console.log('⚠️  WARNING: Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
    console.log('             Tests will run but database operations will be skipped.');
  }
  
  return hasUrl && hasKey;
}

async function testDatabaseConnectionHandling() {
  console.log('\n=== TESTING DATABASE CONNECTION HANDLING ===');
  
  const mockEnv = {
    SUPABASE_URL: null,
    SUPABASE_SERVICE_KEY: null
  };
  
  try {
    // Test 2: Graceful handling of missing configuration
    const context = await getJobOrganizationContext(mockEnv, TEST_CONFIG.testData.jobId);
    logTest('getJobOrganizationContext handles missing config', context === null);
  } catch (error) {
    logTest('getJobOrganizationContext handles missing config', false, error);
  }
  
  try {
    // Test 3: getUserOrganizations with missing config
    const orgs = await getUserOrganizations(mockEnv, TEST_CONFIG.testData.userId);
    logTest('getUserOrganizations handles missing config', Array.isArray(orgs) && orgs.length === 0);
  } catch (error) {
    logTest('getUserOrganizations handles missing config', false, error);
  }
  
  try {
    // Test 4: validateOrganizationAccess with missing config
    const access = await validateOrganizationAccess(mockEnv, TEST_CONFIG.testData.userId, TEST_CONFIG.testData.organizationId);
    logTest('validateOrganizationAccess handles missing config', access === null);
  } catch (error) {
    logTest('validateOrganizationAccess handles missing config', false, error);
  }
}

async function testDatabaseFunctions(hasRealDB) {
  console.log('\n=== TESTING DATABASE FUNCTIONS ===');
  
  if (!hasRealDB) {
    console.log('⚠️  Skipping database function tests (no database configured)');
    return;
  }
  
  try {
    // Test 5: getJobOrganizationContext with real database
    const context = await getJobOrganizationContext(TEST_CONFIG.env, TEST_CONFIG.testData.jobId);
    // This will likely return null for non-existent job, which is correct behavior
    logTest('getJobOrganizationContext executes without error', true);
  } catch (error) {
    logTest('getJobOrganizationContext executes without error', false, error);
  }
  
  try {
    // Test 6: getUserOrganizations with real database
    const orgs = await getUserOrganizations(TEST_CONFIG.env, TEST_CONFIG.testData.userId);
    logTest('getUserOrganizations returns array', Array.isArray(orgs));
  } catch (error) {
    logTest('getUserOrganizations returns array', false, error);
  }
  
  try {
    // Test 7: validateOrganizationAccess with real database
    const access = await validateOrganizationAccess(TEST_CONFIG.env, TEST_CONFIG.testData.userId, TEST_CONFIG.testData.organizationId);
    // This will likely return null for non-existent user/org, which is correct
    logTest('validateOrganizationAccess executes without error', true);
  } catch (error) {
    logTest('validateOrganizationAccess executes without error', false, error);
  }
}

async function testJobCreationAndManagement(hasRealDB) {
  console.log('\n=== TESTING JOB CREATION AND MANAGEMENT ===');
  
  if (!hasRealDB) {
    console.log('⚠️  Skipping job management tests (no database configured)');
    return;
  }
  
  const testJobData = {
    status: 'pending',
    progress: 0,
    automation_type: 'n8n',
    orchestration_plan: { steps: ['test'] }
  };
  
  try {
    // Test 8: createOrganizationAutomationJob
    const job = await createOrganizationAutomationJob(
      TEST_CONFIG.env, 
      TEST_CONFIG.testData.userId, 
      TEST_CONFIG.testData.organizationId, 
      testJobData
    );
    
    // This will likely return null due to access validation failing, which is correct
    logTest('createOrganizationAutomationJob executes without error', true);
  } catch (error) {
    logTest('createOrganizationAutomationJob executes without error', false, error);
  }
  
  try {
    // Test 9: getOrganizationAutomationJobs
    const jobs = await getOrganizationAutomationJobs(TEST_CONFIG.env, TEST_CONFIG.testData.organizationId);
    logTest('getOrganizationAutomationJobs returns array', Array.isArray(jobs));
  } catch (error) {
    logTest('getOrganizationAutomationJobs returns array', false, error);
  }
  
  try {
    // Test 10: getOrganizationUsageStats
    const stats = await getOrganizationUsageStats(TEST_CONFIG.env, TEST_CONFIG.testData.organizationId);
    // This might return null or stats object, both are valid depending on data
    logTest('getOrganizationUsageStats executes without error', true);
  } catch (error) {
    logTest('getOrganizationUsageStats executes without error', false, error);
  }
}

async function testJobProgressAndAutomationSaving(hasRealDB) {
  console.log('\n=== TESTING JOB PROGRESS AND AUTOMATION SAVING ===');
  
  // Test 11: updateJobProgress (should handle missing DB gracefully)
  try {
    await updateJobProgress(TEST_CONFIG.env, TEST_CONFIG.testData.jobId, 50, 'processing');
    logTest('updateJobProgress executes without error', true);
  } catch (error) {
    logTest('updateJobProgress executes without error', false, error);
  }
  
  // Test 12: saveAutomation (should handle missing DB gracefully)
  const testAutomation = {
    name: 'Test Automation',
    description: 'Test automation for testing',
    platform: 'n8n',
    workflow_json: { nodes: [], connections: {} },
    instructions: 'Test instructions'
  };
  
  try {
    const result = await saveAutomation(TEST_CONFIG.env, TEST_CONFIG.testData.jobId, testAutomation);
    logTest('saveAutomation returns automation object', result && result.name === testAutomation.name);
  } catch (error) {
    logTest('saveAutomation returns automation object', false, error);
  }
}

async function testErrorHandling() {
  console.log('\n=== TESTING ERROR HANDLING ===');
  
  const badEnv = {
    SUPABASE_URL: 'https://invalid-url.supabase.co',
    SUPABASE_SERVICE_KEY: 'invalid-key'
  };
  
  try {
    // Test 13: Invalid URL handling
    const context = await getJobOrganizationContext(badEnv, TEST_CONFIG.testData.jobId);
    logTest('Invalid URL handled gracefully', context === null);
  } catch (error) {
    // Should not throw, should return null
    logTest('Invalid URL handled gracefully', false, error);
  }
  
  try {
    // Test 14: Invalid API key handling
    const orgs = await getUserOrganizations(badEnv, TEST_CONFIG.testData.userId);
    logTest('Invalid API key handled gracefully', Array.isArray(orgs) && orgs.length === 0);
  } catch (error) {
    // Should not throw, should return empty array
    logTest('Invalid API key handled gracefully', false, error);
  }
}

async function testDataValidation() {
  console.log('\n=== TESTING DATA VALIDATION ===');
  
  try {
    // Test 15: Invalid UUID handling
    const context = await getJobOrganizationContext(TEST_CONFIG.env, 'invalid-uuid');
    logTest('Invalid UUID handled gracefully', context === null);
  } catch (error) {
    logTest('Invalid UUID handled gracefully', false, error);
  }
  
  try {
    // Test 16: Empty parameters
    const orgs = await getUserOrganizations(TEST_CONFIG.env, '');
    logTest('Empty user ID handled gracefully', Array.isArray(orgs));
  } catch (error) {
    logTest('Empty user ID handled gracefully', false, error);
  }
  
  try {
    // Test 17: Null parameters
    const access = await validateOrganizationAccess(TEST_CONFIG.env, null, null);
    logTest('Null parameters handled gracefully', access === null);
  } catch (error) {
    logTest('Null parameters handled gracefully', false, error);
  }
}

async function printTestSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('WORKERS ORGANIZATION DATABASE TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\nFailed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`- ${test.name}: ${test.error || 'Unknown error'}`);
      });
  }
  
  console.log('\nRecommendations:');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.log('⚠️  Configure SUPABASE_URL and SUPABASE_SERVICE_KEY for full database testing');
  }
  if (testResults.failed === 0) {
    console.log('✅ All tests passed! Organization database integration is working correctly.');
  } else {
    console.log('❌ Some tests failed. Review the errors above and fix before deployment.');
  }
  console.log('='.repeat(50));
}

async function main() {
  console.log('ProcessAudit AI - Workers Organization Database Integration Testing');
  console.log('================================================================');
  
  const hasRealDB = await testEnvironmentSetup();
  await testDatabaseConnectionHandling();
  await testDatabaseFunctions(hasRealDB);
  await testJobCreationAndManagement(hasRealDB);
  await testJobProgressAndAutomationSaving(hasRealDB);
  await testErrorHandling();
  await testDataValidation();
  await printTestSummary();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}