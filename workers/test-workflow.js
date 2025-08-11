#!/usr/bin/env node

/**
 * Simple CLI test script for n8n workflow generation
 * Usage: 
 *   node test-workflow.js email-support-test
 *   node test-workflow.js simple-http-test
 *   node test-workflow.js --production (tests production worker)
 */

import https from 'https';
import http from 'http';

// Configuration
const LOCAL_WORKER_URL = 'http://localhost:8787';
const PRODUCTION_WORKER_URL = 'https://process-audit-automation.damorgs85.workers.dev';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    
    lib.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          resolve({ error: `Failed to parse JSON: ${data}` });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function waitForJobCompletion(baseUrl, jobId, maxWaitTime = 120000) {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds
  
  console.log(`⏳ Waiting for job ${jobId} to complete...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const status = await makeRequest(`${baseUrl}/status/${jobId}`);
      
      if (status.error) {
        throw new Error(status.error);
      }
      
      console.log(`📊 Status: ${status.status} (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
      
      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'failed') {
        throw new Error(status.error || 'Job failed with no error message');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      console.error(`❌ Error checking status: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  throw new Error(`Job ${jobId} did not complete within ${maxWaitTime / 1000} seconds`);
}

function validateWorkflow(workflow, expectedMetadata) {
  const issues = [];
  
  // Check basic structure
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    issues.push("❌ No nodes array found");
  } else {
    console.log(`✅ Found ${workflow.nodes.length} nodes`);
    
    // List node types
    const nodeTypes = workflow.nodes.map(n => n.type).join(', ');
    console.log(`📋 Node types: ${nodeTypes}`);
  }
  
  if (!workflow.connections || typeof workflow.connections !== 'object') {
    issues.push("❌ No connections object found");
  } else {
    const connectionCount = Object.keys(workflow.connections).length;
    console.log(`✅ Found ${connectionCount} connection groups`);
  }
  
  // Validate against expected metadata
  if (expectedMetadata.expectedNodes) {
    const actualNodeTypes = workflow.nodes ? workflow.nodes.map(n => n.type) : [];
    const hasExpectedTypes = expectedMetadata.expectedNodes.some(expected => 
      actualNodeTypes.some(actual => actual.toLowerCase().includes(expected.toLowerCase()))
    );
    
    if (hasExpectedTypes) {
      console.log("✅ Contains some expected node types");
    } else {
      issues.push(`❌ No expected node types found. Expected: ${expectedMetadata.expectedNodes.join(', ')}`);
    }
  }
  
  return issues;
}

async function testWorkflow(fixtureName, useProduction = false) {
  const baseUrl = useProduction ? PRODUCTION_WORKER_URL : LOCAL_WORKER_URL;
  const environment = useProduction ? 'PRODUCTION' : 'LOCAL';
  
  console.log(`\n🧪 Testing ${fixtureName} on ${environment} worker`);
  console.log(`🌐 URL: ${baseUrl}`);
  console.log('─'.repeat(60));
  
  try {
    // Start the test
    console.log(`🚀 Starting test: ${fixtureName}`);
    const testResponse = await makeRequest(`${baseUrl}/test/${fixtureName}`);
    
    if (testResponse.error) {
      throw new Error(testResponse.error);
    }
    
    console.log(`✅ Test job queued: ${testResponse.jobId}`);
    console.log(`📝 Test: ${testResponse.testMetadata.testName}`);
    console.log(`📄 Description: ${testResponse.testMetadata.description}`);
    
    // Wait for completion
    const result = await waitForJobCompletion(baseUrl, testResponse.jobId);
    
    console.log('\n📊 RESULTS:');
    console.log('─'.repeat(40));
    
    if (result.result?.workflow) {
      const workflow = result.result.workflow;
      const issues = validateWorkflow(workflow, testResponse.testMetadata);
      
      if (issues.length === 0) {
        console.log('✅ All validations passed!');
      } else {
        console.log('⚠️  Validation issues found:');
        issues.forEach(issue => console.log(`  ${issue}`));
      }
      
      // Show generation metadata
      if (result.result.metadata) {
        console.log(`\n🔧 Generation metadata:`);
        console.log(`  Method: ${result.result.metadata.method || 'Unknown'}`);
        console.log(`  Took: ${result.result.metadata.executionTime || 'Unknown'}ms`);
        if (result.result.metadata.usedMCP) {
          console.log(`  🤖 MCP: ${result.result.metadata.usedMCP ? 'Used' : 'Fallback'}`);
        }
        if (result.result.metadata.usedIntelligentSystem) {
          console.log(`  🧠 Intelligent: ${result.result.metadata.usedIntelligentSystem ? 'Yes' : 'No'}`);
        }
      }
      
    } else {
      console.log('❌ No workflow found in result');
      console.log('Result:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const useProduction = args.includes('--production');
  const fixtureName = args.find(arg => !arg.startsWith('--')) || 'email-support-test';
  
  console.log('🔧 ProcessAudit AI - n8n Workflow Generator Test');
  
  try {
    await testWorkflow(fixtureName, useProduction);
    console.log('\n🎉 Test completed successfully!');
  } catch (error) {
    console.error(`\n💥 Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔧 ProcessAudit AI - n8n Workflow Generator Test

Usage:
  node test-workflow.js [fixture-name] [--production]

Available fixtures:
  • email-support-test    - Complex email automation (tests intelligent system)
  • simple-http-test      - Basic HTTP workflow (tests blueprints)

Options:
  --production           - Test against production worker
  --help, -h            - Show this help

Examples:
  node test-workflow.js email-support-test
  node test-workflow.js simple-http-test --production
  node test-workflow.js --production
`);
  process.exit(0);
}

main();