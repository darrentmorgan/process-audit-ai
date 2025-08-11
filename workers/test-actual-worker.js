#!/usr/bin/env node

/**
 * Test the ACTUAL Enhanced Orchestrator output from our worker
 */

import { generateN8nWorkflowHybrid } from './src/generators/n8n-mcp.js';
import { validateN8nWorkflow } from './src/generators/n8n.js';
import fs from 'fs';

// Mock environment 
const mockEnv = {
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY
};

// This is the Enhanced Orchestrator plan our system generates
const sophisticatedPlan = {
  workflowName: 'Email-Sheets-Airtable Integration Workflow',
  description: 'Sophisticated automation combining email processing, Google Sheets tracking, and Airtable data management',
  complexity: 'high',
  estimatedProcessingTime: '2-5 minutes',
  triggers: [
    {
      type: 'gmail',
      name: 'New Email Trigger',
      configuration: {
        folder: 'INBOX',
        filter: 'has:attachment OR subject:(inquiry OR support)',
        markAsRead: false
      }
    }
  ],
  steps: [
    {
      id: 'email_analysis',
      name: 'AI Email Analysis',
      type: 'openai',
      description: 'Analyze email content and extract structured data',
      configuration: {
        model: 'gpt-3.5-turbo',
        prompt: 'Analyze this email and extract key information as JSON',
        temperature: 0.1
      }
    },
    {
      id: 'sheets_update',
      name: 'Update Google Sheets',
      type: 'googleSheets',
      description: 'Log email data to tracking spreadsheet',
      configuration: {
        operation: 'append',
        sheetId: '{{ $env.SHEET_ID }}',
        values: ['{{ $json.timestamp }}', '{{ $json.from }}', '{{ $json.subject }}', '{{ $json.priority }}']
      }
    },
    {
      id: 'airtable_record',
      name: 'Create Airtable Record',
      type: 'airtable',
      description: 'Create comprehensive customer record',
      configuration: {
        operation: 'create',
        base: '{{ $env.AIRTABLE_BASE }}',
        table: 'Customer_Inquiries',
        fields: {
          Email: '{{ $json.from }}',
          Subject: '{{ $json.subject }}',
          Priority: '{{ $json.priority }}',
          Status: 'Processing'
        }
      }
    },
    {
      id: 'ai_response',
      name: 'Generate AI Response',
      type: 'openai',
      description: 'Create personalized response based on analysis',
      configuration: {
        model: 'gpt-3.5-turbo',
        prompt: 'Generate a professional email response for: {{ $json.main_issue }}',
        temperature: 0.3
      }
    }
  ],
  connections: [
    { from: 'New Email Trigger', to: 'email_analysis' },
    { from: 'email_analysis', to: 'sheets_update' },
    { from: 'sheets_update', to: 'airtable_record' },
    { from: 'airtable_record', to: 'ai_response' }
  ]
};

async function testActualWorkerOutput() {
  console.log('🧪 Testing ACTUAL Enhanced Orchestrator Worker Output');
  console.log('=' .repeat(70));
  console.log('This shows what our Enhanced Orchestrator system REALLY generates');
  console.log('=' .repeat(70));

  try {
    console.log('🧠 Processing sophisticated orchestration plan...');
    const workflow = await generateN8nWorkflowHybrid(mockEnv, sophisticatedPlan, { id: 'test-actual' });
    
    console.log('\n✅ ACTUAL ENHANCED ORCHESTRATOR WORKFLOW GENERATED!');
    console.log('=' .repeat(50));
    console.log(`📊 Workflow Name: ${workflow.name}`);
    console.log(`📝 Description: ${workflow.description}`);
    console.log(`🔧 Total Nodes: ${workflow.nodes.length}`);
    console.log(`🔗 Total Connections: ${Object.keys(workflow.connections || {}).length}`);
    
    console.log('\n🔧 Generated Node Types:');
    workflow.nodes.forEach((node, i) => {
      console.log(`   ${i + 1}. ${node.name} (${node.type})`);
    });
    
    // Validate the actual workflow
    const validation = validateN8nWorkflow(workflow);
    console.log(`\n✅ n8n Workflow Validation: ${validation.valid ? 'VALID ✅' : 'INVALID ❌'}`);
    if (!validation.valid && validation.errors) {
      console.log('Validation Errors:');
      validation.errors.forEach(error => console.log('   ❌', error));
    }
    
    // Save the ACTUAL output from our Enhanced Orchestrator
    fs.writeFileSync('ACTUAL-enhanced-orchestrator-workflow.json', JSON.stringify(workflow, null, 2));
    console.log('\n💾 ACTUAL Enhanced Orchestrator output saved to:');
    console.log('📁 ACTUAL-enhanced-orchestrator-workflow.json');
    console.log('\n🎯 This is what your Enhanced Orchestrator system REALLY generates!');
    console.log('🚀 Import this file into n8n to see the sophisticated workflow in action.');
    
  } catch (error) {
    console.error('\n❌ Enhanced Orchestrator failed:', error.message);
    console.error('Stack:', error.stack);
    console.error('\nThis shows the actual behavior when your worker processes the sophisticated plan.');
  }
}

testActualWorkerOutput().catch(console.error);