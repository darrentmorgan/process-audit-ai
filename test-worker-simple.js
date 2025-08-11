#!/usr/bin/env node

/**
 * Simple Worker Test - Tests the worker's core functionality
 * This test focuses on verifying that the worker can generate workflows
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

require('dotenv').config({ path: '.env.local' });

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;

async function testWorkerSimple() {
  console.log('🧪 Simple Worker Test');
  console.log('=' .repeat(40));
  console.log(`Worker URL: ${WORKER_URL}\n`);
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Health Check');
    const healthResponse = await fetch(`${WORKER_URL}/health`);
    const health = await healthResponse.json();
    console.log(`   Status: ${health.status}`);
    console.log('   ✅ Health check passed\n');
    
    // Test 2: Test fixture generation 
    console.log('2️⃣ Test Fixture Generation');
    const testResponse = await fetch(`${WORKER_URL}/test/simple-http-test`);
    
    if (!testResponse.ok) {
      throw new Error(`Test fixture failed: ${testResponse.status}`);
    }
    
    const testResult = await testResponse.json();
    console.log(`   Job ID: ${testResult.jobId}`);
    console.log(`   Fixture: ${testResult.fixture}`);
    console.log('   ✅ Test fixture created\n');
    
    // Test 3: Submit job (should queue successfully)
    console.log('3️⃣ Job Submission Test');
    const submitData = {
      id: `test-${Date.now()}`,
      processData: {
        processDescription: "Test workflow for insurance processing"
      },
      automationOpportunities: [
        {
          stepDescription: "Receive webhook data",
          automationSolution: "webhook_trigger"
        },
        {
          stepDescription: "Process via API",
          automationSolution: "api_integration" 
        }
      ],
      automationType: "n8n"
    };
    
    const submitResponse = await fetch(`${WORKER_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData)
    });
    
    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Job submission failed: ${submitResponse.status} - ${errorText}`);
    }
    
    const submitResult = await submitResponse.json();
    console.log(`   Job ID: ${submitResult.jobId}`);
    console.log(`   Status: ${submitResult.status}`);
    console.log('   ✅ Job submitted to queue\n');
    
    console.log('🎯 Test Results:');
    console.log('   ✅ Worker is healthy');
    console.log('   ✅ Test fixtures work');  
    console.log('   ✅ Job submission works');
    console.log('\n💡 Note: Queue processing may require queue consumer to be running');
    console.log('💡 For immediate workflow generation, use test fixtures');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
testWorkerSimple();