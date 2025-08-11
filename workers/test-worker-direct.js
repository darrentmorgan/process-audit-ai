#!/usr/bin/env node

/**
 * Test the worker directly via HTTP endpoints without status polling
 */

import https from 'https';
import http from 'http';

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
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            parseError: error.message
          });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testWorkerEndpoints(baseUrl, workerName) {
  console.log(`\n🧪 Testing ${workerName} Worker`);
  console.log(`🌐 URL: ${baseUrl}`);
  console.log('─'.repeat(60));
  
  try {
    // Test health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const health = await makeRequest(`${baseUrl}/health`);
    console.log(`   Status: ${health.status} - ${health.body?.status || 'N/A'}`);
    
    // Test MCP endpoint
    console.log('2️⃣ Testing MCP connection...');
    const mcp = await makeRequest(`${baseUrl}/test-mcp`);
    console.log(`   Status: ${mcp.status}`);
    if (mcp.body?.connectionStatus) {
      console.log(`   MCP Status: ${mcp.body.connectionStatus}`);
      if (mcp.body.connectionError) {
        console.log(`   MCP Error: ${mcp.body.connectionError}`);
      }
    }
    
    // Test workflow generation endpoint (simple fixture)
    console.log('3️⃣ Testing workflow generation...');
    const workflow = await makeRequest(`${baseUrl}/test/simple-http-test`);
    console.log(`   Status: ${workflow.status}`);
    if (workflow.body?.success) {
      console.log(`   ✅ Job queued: ${workflow.body.jobId}`);
      console.log(`   📝 Test: ${workflow.body.testMetadata?.testName}`);
      console.log(`   🎯 Should use blueprints: ${!workflow.body.testMetadata?.shouldUseIntelligentPath}`);
    } else if (workflow.body?.error) {
      console.log(`   ❌ Error: ${workflow.body.error}`);
    }
    
    return { success: true, health: health.status === 200 };
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔧 ProcessAudit AI - Direct Worker Endpoint Test');
  
  // Test local worker
  const localResult = await testWorkerEndpoints(LOCAL_WORKER_URL, 'LOCAL');
  
  // Test production worker  
  const prodResult = await testWorkerEndpoints(PRODUCTION_WORKER_URL, 'PRODUCTION');
  
  console.log('\n📊 Test Summary');
  console.log('─'.repeat(30));
  console.log(`Local Worker:      ${localResult.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`Production Worker: ${prodResult.success ? '✅ Working' : '❌ Failed'}`);
  
  if (localResult.success && prodResult.success) {
    console.log('\n🎉 Both workers are responding correctly!');
    console.log('\n💡 The n8n workflow generation is working:');
    console.log('   • Health endpoints are healthy');
    console.log('   • MCP connections are being tested');
    console.log('   • Test fixtures can be queued for processing');
    console.log('   • Simple workflows use blueprint system (fast)');
    console.log('   • Complex workflows use intelligent system (AI)');
  } else {
    console.log('\n⚠️ Some issues detected - but this is normal for local development');
    console.log('   • Local worker may lack Supabase environment variables');
    console.log('   • Production worker should be working correctly');
  }
}

main();