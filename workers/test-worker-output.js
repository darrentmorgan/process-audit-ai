#!/usr/bin/env node

/**
 * Test actual worker processing to show real Enhanced Orchestrator output
 */

import { processAutomationJob } from './src/processor.js';

// Mock environment without Supabase to avoid connection issues
const mockEnv = {
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  N8N_MCP_SERVER_URL: "https://czlonkowskin8n-mcp-railwaylatest-production-a820.up.railway.app",
  N8N_MCP_AUTH_TOKEN: "mock_token" // Will fail but shows the flow
};

// Use the exact same fixture from the worker
const sophisticatedJob = {
  id: "test-worker-output",
  jobType: "n8n",
  processData: {
    processDescription: "Customer inquiries arrive via email, need to be categorized, tracked in Google Sheets, stored in Airtable with enriched data, and responded to with personalized AI-generated responses",
    businessContext: {
      industry: "Customer Support",
      department: "Operations", 
      volume: "50-100 emails per day",
      complexity: "High - requires email parsing, data extraction, multi-platform integration, and AI-powered responses"
    }
  },
  automationOpportunities: [
    {
      stepDescription: "AI-powered email classification and data extraction from customer inquiries",
      automationSolution: "ai_email_processing",
      priority: "high"
    },
    {
      stepDescription: "Automated Google Sheets tracking and Airtable record creation with enriched customer data", 
      automationSolution: "dual_platform_data_storage",
      priority: "high"
    },
    {
      stepDescription: "Intelligent response generation and automated email reply with personalization",
      automationSolution: "ai_response_automation",
      priority: "medium"
    }
  ]
};

// Mock the database functions to avoid Supabase issues
const originalUpdateProgress = await import('./src/database.js');
const mockDatabase = {
  updateJobProgress: async (env, jobId, progress, status, error) => {
    console.log(`📊 Job Progress: ${jobId} - ${progress}% - ${status}${error ? ` (Error: ${error})` : ''}`);
  },
  saveAutomation: async (env, jobId, automation) => {
    console.log(`💾 Automation Saved for ${jobId}:`);
    console.log(`   Name: ${automation.name}`);
    console.log(`   Platform: ${automation.platform}`);
    console.log(`   Workflow nodes: ${automation.workflow_json?.nodes?.length || 'unknown'}`);
    
    // Save the actual generated workflow to file
    const fs = await import('fs');
    fs.writeFileSync('actual-worker-generated-workflow.json', JSON.stringify(automation.workflow_json, null, 2));
    console.log('✅ Actual workflow saved to: actual-worker-generated-workflow.json');
    
    return automation;
  }
};

// Override database module
import('./src/database.js').then(module => {
  module.updateJobProgress = mockDatabase.updateJobProgress;
  module.saveAutomation = mockDatabase.saveAutomation;
});

async function testActualWorkerOutput() {
  console.log('🧪 Testing ACTUAL Worker Processing with Enhanced Orchestrator');
  console.log('=' .repeat(80));
  console.log('This will show what our worker ACTUALLY generates, not mock data');
  console.log('=' .repeat(80));
  
  try {
    const result = await processAutomationJob(mockEnv, sophisticatedJob);
    
    console.log('\n🎉 ACTUAL WORKER OUTPUT GENERATED!');
    console.log('=' .repeat(50));
    console.log(`✅ Workflow Name: ${result.name}`);
    console.log(`📝 Description: ${result.description}`);
    console.log(`🔧 Platform: ${result.platform}`);
    console.log(`📊 Total Nodes: ${result.workflow_json?.nodes?.length || 'unknown'}`);
    
    if (result.workflow_json?.nodes) {
      console.log('\n🔧 Generated Nodes:');
      result.workflow_json.nodes.forEach((node, i) => {
        console.log(`   ${i + 1}. ${node.name} (${node.type})`);
      });
    }
    
    console.log('\n📁 Complete workflow JSON saved to: actual-worker-generated-workflow.json');
    console.log('🎯 This is the REAL output from our Enhanced Orchestrator system!');
    
  } catch (error) {
    console.error('\n❌ Worker processing failed:', error.message);
    console.error('This shows what happens when the worker runs with your configuration.');
  }
}

testActualWorkerOutput().catch(console.error);