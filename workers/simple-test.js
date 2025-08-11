#!/usr/bin/env node

/**
 * Simple test to validate workflow generation without the complex queue system
 */

import { generateN8nWorkflow } from './src/generators/n8n.js';

// Test data similar to what would come from main app
const emailSupportTest = {
  orchestrationPlan: {
    description: "Customer support email handling process automation - categorize emails, research customer history, draft responses, and route for approval",
    triggers: [
      {
        type: "email",
        source: "support@company.com",
        frequency: "immediate"
      }
    ],
    steps: [
      {
        type: "email",
        action: "categorize",
        description: "Automatically categorize incoming emails as billing, technical, or general inquiry"
      },
      {
        type: "data_lookup", 
        action: "customer_research",
        description: "Look up customer account history and previous interactions"
      },
      {
        type: "ai_processing",
        action: "draft_response", 
        description: "Generate appropriate response based on category and customer history"
      },
      {
        type: "conditional",
        action: "approval_routing",
        description: "Route complex issues to manager for approval, send simple responses directly"
      },
      {
        type: "email",
        action: "send_response",
        description: "Send the final response to the customer"
      }
    ],
    integrations: ["gmail", "crm", "knowledge_base"],
    complexity: "medium"
  }
};

const simpleHttpTest = {
  orchestrationPlan: {
    description: "Simple HTTP API workflow - fetch data and process it",
    triggers: [
      {
        type: "webhook",
        source: "external"
      }
    ],
    steps: [
      {
        type: "http",
        action: "fetch_data",
        description: "Fetch data from external REST API"
      },
      {
        type: "transform",
        action: "transform",
        description: "Transform the received data"
      }
    ],
    complexity: "simple"
  }
};

async function testWorkflowGeneration(testName, testData) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    
    // Use real environment or mock for testing
    const mockEnv = {
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || 'test-key-will-cause-fallback',
      N8N_MCP_AUTH_TOKEN: process.env.N8N_MCP_AUTH_TOKEN || 'test-token',
      N8N_MCP_SERVER_URL: process.env.N8N_MCP_SERVER_URL || 'https://czlonkowskin8n-mcp-railwaylatest-production-a820.up.railway.app'
    };
    
    const hasRealApiKey = process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY.startsWith('sk-');
    if (!hasRealApiKey) {
      console.log('ℹ️  No real Claude API key found - testing blueprint fallback mode');
    }
    
    console.log('🔄 Generating workflow...');
    
    // Mock job object
    const mockJob = {
      processData: testData.orchestrationPlan,
      id: 'test-job-' + Date.now()
    };
    
    const result = await generateN8nWorkflow(mockEnv, testData.orchestrationPlan, mockJob);
    
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ Generation completed in ${executionTime}ms`);
    
    // Handle both direct workflow return and wrapped result
    const workflow = result.workflow || result;
    if (workflow && workflow.nodes) {
      const nodeCount = workflow.nodes ? workflow.nodes.length : 0;
      const connectionGroups = workflow.connections ? Object.keys(workflow.connections).length : 0;
      
      console.log(`📊 Results:`);
      console.log(`  • Nodes: ${nodeCount}`);
      console.log(`  • Connection groups: ${connectionGroups}`);
      
      const nodeTypes = workflow.nodes.map(n => n.type).join(', ');
      console.log(`  • Node types: ${nodeTypes}`);
      
      // Check if it's using intelligent system (email workflows should)
      const isEmailWorkflow = testData.orchestrationPlan.description.toLowerCase().includes('email');
      const hasAINodes = workflow.nodes.some(n => 
        n.type.toLowerCase().includes('openai') || 
        n.type.toLowerCase().includes('ai') ||
        n.type.includes('Langchain')
      );
      
      if (isEmailWorkflow && hasAINodes) {
        console.log(`  • ✅ Email workflow correctly uses AI nodes (intelligent system)`);
      } else if (!isEmailWorkflow && !hasAINodes) {
        console.log(`  • ✅ Simple workflow uses basic nodes (blueprint system)`);
      }
      
      // Basic validation
      if (nodeCount >= 2 && connectionGroups >= 1) {
        console.log(`  • ✅ Valid workflow structure`);
      } else {
        console.log(`  • ⚠️ Minimal workflow structure`);
      }
      
      return true;
    } else {
      console.log(`❌ No workflow generated`);
      console.log('Result:', JSON.stringify(result, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

async function main() {
  console.log('🔧 ProcessAudit AI - Direct n8n Workflow Generation Test');
  
  let passed = 0;
  let total = 0;
  
  // Test email workflow (should use intelligent system)
  total++;
  if (await testWorkflowGeneration('Email Support Automation', emailSupportTest)) {
    passed++;
  }
  
  // Test simple HTTP workflow (should use blueprints)
  total++;
  if (await testWorkflowGeneration('Simple HTTP Workflow', simpleHttpTest)) {
    passed++;
  }
  
  console.log('\n📊 Test Summary');
  console.log('─'.repeat(30));
  console.log(`✅ Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});