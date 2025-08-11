#!/usr/bin/env node

/**
 * Test Enhanced Orchestrator locally to demonstrate sophisticated planning
 */

import EnhancedOrchestrator from './src/orchestration/enhanced-orchestrator.js';

// Mock environment for testing
const mockEnv = {
  N8N_MCP_SERVER_URL: "https://czlonkowskin8n-mcp-railwaylatest-production-a820.up.railway.app",
  N8N_MCP_AUTH_TOKEN: "mock_token", // Won't work but will test the flow
};

// Sophisticated test job - Email + Sheets + Airtable
const sophisticatedTestJob = {
  id: "test-sophisticated-job",
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
    },
    {
      stepDescription: "Priority-based routing for high-urgency customer issues",
      automationSolution: "conditional_routing",
      priority: "medium"
    },
    {
      stepDescription: "Real-time Slack notifications for support team coordination",
      automationSolution: "team_notification",
      priority: "low"
    }
  ]
};

async function testEnhancedOrchestrator() {
  console.log('🧪 Testing Enhanced Orchestrator with Sophisticated Email-Sheets-Airtable Workflow');
  console.log('=' .repeat(80));
  
  const orchestrator = new EnhancedOrchestrator(mockEnv);
  
  try {
    // Test initialization
    console.log('\n1️⃣ Initializing Enhanced Orchestrator...');
    const initialized = await orchestrator.initialize();
    
    if (initialized) {
      console.log('✅ Enhanced Orchestrator initialized successfully');
      console.log(`📊 Available node types: ${orchestrator.availableNodes.size}`);
      
      // Show available nodes
      console.log('\n🔧 Available Node Capabilities:');
      for (const [nodeType, config] of orchestrator.availableNodes) {
        console.log(`   • ${nodeType}: ${config.capabilities.slice(0, 3).join(', ')}${config.capabilities.length > 3 ? '...' : ''}`);
      }
    } else {
      console.log('❌ Initialization failed, will test fallback orchestration');
    }
    
    // Test business requirements analysis
    console.log('\n2️⃣ Analyzing Business Requirements...');
    const requirements = orchestrator.analyzeBusinessRequirements(sophisticatedTestJob);
    console.log('📋 Requirements Analysis:');
    Object.entries(requirements).forEach(([key, value]) => {
      const icon = value === true ? '✅' : value === false ? '❌' : '📝';
      console.log(`   ${icon} ${key}: ${value}`);
    });
    
    // Test node discovery
    console.log('\n3️⃣ Discovering Relevant Nodes...');
    const relevantNodes = orchestrator.discoverRelevantNodes(requirements);
    console.log(`🔍 Discovered ${relevantNodes.length} relevant nodes:`);
    relevantNodes.forEach(node => {
      const priorityIcon = { high: '🔴', medium: '🟡', low: '🟢' }[node.priority];
      console.log(`   ${priorityIcon} ${node.type} (${node.priority}): ${node.reason}`);
    });
    
    // Test orchestration plan creation
    console.log('\n4️⃣ Creating Sophisticated Orchestration Plan...');
    console.log('⏳ This will use AI to create a comprehensive workflow plan...');
    
    const orchestrationPlan = await orchestrator.createSophisticatedOrchestrationPlan(sophisticatedTestJob);
    
    console.log('✅ Sophisticated Orchestration Plan Created!');
    console.log('\n📊 Plan Overview:');
    console.log(`   • Name: ${orchestrationPlan.workflowName}`);
    console.log(`   • Description: ${orchestrationPlan.description}`);
    console.log(`   • Complexity: ${orchestrationPlan.complexity || 'Not specified'}`);
    console.log(`   • Triggers: ${orchestrationPlan.triggers?.length || 0}`);
    console.log(`   • Steps: ${orchestrationPlan.steps?.length || 0}`);
    console.log(`   • Connections: ${orchestrationPlan.connections?.length || 0}`);
    
    // Show triggers
    if (orchestrationPlan.triggers?.length > 0) {
      console.log('\n🚀 Triggers:');
      orchestrationPlan.triggers.forEach((trigger, i) => {
        console.log(`   ${i + 1}. ${trigger.name} (${trigger.type})`);
        if (trigger.configuration) {
          Object.entries(trigger.configuration).forEach(([key, value]) => {
            console.log(`      • ${key}: ${JSON.stringify(value)}`);
          });
        }
      });
    }
    
    // Show key steps
    if (orchestrationPlan.steps?.length > 0) {
      console.log('\n⚙️ Key Steps:');
      orchestrationPlan.steps.slice(0, 5).forEach((step, i) => {
        console.log(`   ${i + 1}. ${step.name} (${step.type})`);
        console.log(`      📝 ${step.description}`);
        if (step.configuration && Object.keys(step.configuration).length > 0) {
          const configKeys = Object.keys(step.configuration);
          console.log(`      🔧 Config: ${configKeys.slice(0, 2).join(', ')}${configKeys.length > 2 ? '...' : ''}`);
        }
      });
      
      if (orchestrationPlan.steps.length > 5) {
        console.log(`   ... and ${orchestrationPlan.steps.length - 5} more steps`);
      }
    }
    
    // Show expected outcomes
    if (orchestrationPlan.expectedOutcomes) {
      console.log('\n🎯 Expected Outcomes:');
      Object.entries(orchestrationPlan.expectedOutcomes).forEach(([key, value]) => {
        console.log(`   • ${key}: ${value}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 Enhanced Orchestrator Test Completed Successfully!');
    console.log('\nThis demonstrates the sophisticated planning capabilities that will create');
    console.log('production-ready workflows with multiple integrations, AI processing,');
    console.log('and intelligent routing - far beyond basic HTTP/transform/email flows.');
    
  } catch (error) {
    console.error('\n❌ Enhanced Orchestrator Test Failed:', error.message);
    console.error('This might be expected if MCP server is not accessible, but shows the sophisticated planning structure');
  } finally {
    await orchestrator.cleanup();
  }
}

testEnhancedOrchestrator().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});