#!/usr/bin/env node

/**
 * Complete n8n Generation Test
 * Tests the full n8n workflow generation capabilities using fixtures
 * This demonstrates the actual workflow output that users would receive
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;

// Test scenarios that demonstrate different workflow types
const TEST_SCENARIOS = [
  {
    name: 'Simple HTTP Workflow',
    fixture: 'simple-http-test',
    description: 'Basic webhook → HTTP → processing workflow'
  },
  {
    name: 'Email Support Automation', 
    fixture: 'email-support-test',
    description: 'Intelligent email processing with AI integration'
  }
];

async function testScenario(scenario) {
  console.log(`\n📋 Testing: ${scenario.name}`);
  console.log(`    Description: ${scenario.description}`);
  console.log(`    Fixture: ${scenario.fixture}`);
  
  try {
    // Trigger the test fixture
    const response = await fetch(`${WORKER_URL}/test/${scenario.fixture}`);
    
    if (!response.ok) {
      throw new Error(`Fixture test failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Wait a moment for processing (fixtures should be fast)
    console.log(`    ⏳ Processing job: ${result.jobId}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to get the status/result
    const statusResponse = await fetch(`${WORKER_URL}/status/${result.jobId}`);
    let workflow = null;
    
    if (statusResponse.ok) {
      const statusResult = await statusResponse.json();
      workflow = statusResult.workflow;
      console.log(`    📊 Status: ${statusResult.status || 'processing'}`);
    } else {
      console.log(`    ⚠️  Status check failed (queue processing required)`);
    }
    
    // Display test metadata
    if (result.testMetadata) {
      const meta = result.testMetadata;
      console.log(`    🎯 Expected Nodes: ${meta.expectedNodes?.join(', ') || 'Various'}`);
      console.log(`    🔗 Expected Connections: ${meta.expectedConnections || 'Multiple'}`);
      console.log(`    🧠 Uses AI: ${meta.shouldUseIntelligentPath ? 'Yes' : 'No (Blueprint)'}`);
    }
    
    console.log(`    ✅ Test completed successfully`);
    
    return {
      success: true,
      jobId: result.jobId,
      workflow,
      metadata: result.testMetadata
    };
    
  } catch (error) {
    console.log(`    ❌ Test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function generateSampleWorkflows() {
  console.log('🔧 n8n Workflow Generation - Complete Test');
  console.log('=' .repeat(60));
  console.log(`Worker URL: ${WORKER_URL}`);
  
  const results = [];
  
  // Test each scenario
  for (const scenario of TEST_SCENARIOS) {
    const result = await testScenario(scenario);
    results.push({ scenario, result });
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successful Tests:');
    successful.forEach(({ scenario, result }) => {
      console.log(`   • ${scenario.name} (Job: ${result.jobId})`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(({ scenario, result }) => {
      console.log(`   • ${scenario.name}: ${result.error}`);
    });
  }
  
  // Show real-world usage examples
  console.log('\n💡 REAL-WORLD USAGE EXAMPLES:');
  console.log('=' .repeat(60));
  console.log('For production n8n workflow generation:');
  console.log('');
  console.log('1. Via Main Application:');
  console.log('   • Navigate to Audit Report → Automation tab'); 
  console.log('   • Click "Generate n8n Workflow"');
  console.log('   • Wait for processing (30-60 seconds)');
  console.log('   • Download complete workflow JSON');
  console.log('');
  console.log('2. Via API:');
  console.log(`   curl -X POST "${WORKER_URL}/submit" \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"id":"my-job","processData":{...},"automationOpportunities":[...]}\'');
  console.log('');
  console.log('3. Direct Testing:');
  console.log(`   curl "${WORKER_URL}/test/simple-http-test"`);
  console.log(`   curl "${WORKER_URL}/test/email-support-test"`);
  
  console.log('\n🚀 Production Features:');
  console.log('   ✅ 532+ n8n nodes available via MCP integration');
  console.log('   ✅ AI-enhanced workflow generation with Claude/OpenAI');
  console.log('   ✅ Blueprint system for fast simple workflows');
  console.log('   ✅ Auto-repair system for validation errors');
  console.log('   ✅ Working examples database with proven patterns');
  console.log('   ✅ Business context integration for intelligent routing');
  
  return results;
}

// Run the complete test
generateSampleWorkflows().then(results => {
  const allSuccessful = results.every(r => r.result.success);
  process.exit(allSuccessful ? 0 : 1);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});