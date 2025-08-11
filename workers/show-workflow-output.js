#!/usr/bin/env node

/**
 * Show n8n workflow output in detail
 */

import { generateN8nWorkflow } from './src/generators/n8n.js';
import fs from 'fs/promises';

// Simple HTTP test that uses blueprints
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

async function showWorkflowOutput() {
  console.log('🔧 ProcessAudit AI - n8n Workflow Output Demo\n');
  
  try {
    const mockEnv = {
      CLAUDE_API_KEY: 'test-key-will-cause-fallback',
      N8N_MCP_AUTH_TOKEN: 'test-token',
      N8N_MCP_SERVER_URL: 'https://example.com'
    };
    
    const mockJob = {
      processData: simpleHttpTest.orchestrationPlan,
      id: 'demo-job-' + Date.now()
    };
    
    console.log('📝 Input Process Plan:');
    console.log('─'.repeat(40));
    console.log(JSON.stringify(simpleHttpTest.orchestrationPlan, null, 2));
    
    console.log('\n🔄 Generating n8n workflow...\n');
    
    const startTime = Date.now();
    const workflow = await generateN8nWorkflow(mockEnv, simpleHttpTest.orchestrationPlan, mockJob);
    const executionTime = Date.now() - startTime;
    
    console.log('✅ n8n Workflow Generated Successfully!');
    console.log(`⏱️  Generation time: ${executionTime}ms (using blueprints)`);
    console.log(`📊 Nodes: ${workflow.nodes?.length || 0}`);
    console.log(`🔗 Connections: ${Object.keys(workflow.connections || {}).length}`);
    
    console.log('\n📄 Complete n8n Workflow JSON:');
    console.log('─'.repeat(80));
    console.log(JSON.stringify(workflow, null, 2));
    
    // Save to file for easy import into n8n
    const filename = `generated-workflow-${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(workflow, null, 2));
    console.log(`\n💾 Workflow saved to: ${filename}`);
    console.log('   You can import this file directly into n8n!');
    
    // Show node details
    console.log('\n🔍 Node Details:');
    console.log('─'.repeat(40));
    workflow.nodes?.forEach((node, index) => {
      console.log(`${index + 1}. ${node.name} (${node.type})`);
      console.log(`   Position: [${node.position[0]}, ${node.position[1]}]`);
      console.log(`   Parameters: ${JSON.stringify(node.parameters, null, 4)}`);
      console.log('');
    });
    
    // Show connections
    console.log('🔗 Node Connections:');
    console.log('─'.repeat(40));
    Object.entries(workflow.connections || {}).forEach(([fromNode, connections]) => {
      const targets = connections.main[0] || [];
      targets.forEach(target => {
        console.log(`   ${fromNode} → ${target.node}`);
      });
    });
    
    console.log('\n🎯 Workflow Metadata:');
    console.log('─'.repeat(40));
    console.log(`Name: ${workflow.name}`);
    console.log(`Description: ${workflow.description || 'N/A'}`);
    console.log(`Generated: ${workflow.meta?.generatedAt}`);
    console.log(`Version: ${workflow.meta?.version}`);
    console.log(`Plan Hash: ${workflow.meta?.planHash}`);
    
  } catch (error) {
    console.error('❌ Failed to generate workflow:', error.message);
    console.error(error.stack);
  }
}

showWorkflowOutput();