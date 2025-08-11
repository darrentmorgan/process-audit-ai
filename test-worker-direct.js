#!/usr/bin/env node

/**
 * Direct Worker Test - Tests worker endpoints without queue system
 * This bypasses the queue and tests the worker's direct generation capabilities
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

require('dotenv').config({ path: '.env.local' });

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;

const TEST_DATA = {
  processData: {
    processDescription: "Insurance appeal processing workflow",
    businessContext: {
      industry: "Insurance", 
      department: "Claims Processing",
      volume: "100-500 appeals per month"
    }
  },
  automationOpportunities: [
    {
      stepDescription: "Receive appeal submission via webhook",
      automationSolution: "webhook_trigger",
      priority: "high"
    },
    {
      stepDescription: "Submit appeal to external processing API",
      automationSolution: "api_integration", 
      priority: "high"
    },
    {
      stepDescription: "Send notification email",
      automationSolution: "email_automation",
      priority: "medium"
    }
  ]
};

async function testWorkerDirectly() {
  console.log('🧪 Testing Worker Direct Generation');
  console.log('=' .repeat(50));
  console.log(`Worker URL: ${WORKER_URL}`);
  
  try {
    // Test health first
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${WORKER_URL}/health`);
    const health = await healthResponse.json();
    console.log(`✅ Health: ${JSON.stringify(health)}`);
    
    // Test direct generation endpoint
    console.log('\n2️⃣ Testing direct generation...');
    const startTime = Date.now();
    
    const response = await fetch(`${WORKER_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_DATA)
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Generation failed: ${response.status} - ${errorText}`);
      return;
    }
    
    const result = await response.json();
    console.log(`✅ Generation completed in ${duration}ms`);
    
    // Validate workflow
    if (result.workflow && result.workflow.nodes) {
      const nodeCount = result.workflow.nodes.length;
      const nodeTypes = result.workflow.nodes.map(n => n.type);
      
      console.log('\n📋 Workflow Summary:');
      console.log(`   Name: ${result.workflow.name}`);
      console.log(`   Nodes: ${nodeCount}`);
      console.log(`   Types: ${[...new Set(nodeTypes)].join(', ')}`);
      console.log(`   Generation Method: ${result.metadata?.generationMethod || 'unknown'}`);
      
      // Check for expected nodes
      const hasWebhook = nodeTypes.some(t => t.includes('webhook'));
      const hasHttp = nodeTypes.some(t => t.includes('httpRequest'));
      const hasEmail = nodeTypes.some(t => t.includes('emailSend'));
      
      console.log(`   🌐 Webhook: ${hasWebhook ? '✅' : '❌'}`);
      console.log(`   📡 HTTP: ${hasHttp ? '✅' : '❌'}`);  
      console.log(`   📧 Email: ${hasEmail ? '✅' : '❌'}`);
      
      console.log('\n✅ Direct worker test completed successfully!');
      
    } else {
      console.error('❌ Invalid workflow structure returned');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
testWorkerDirectly();