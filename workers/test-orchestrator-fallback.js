#!/usr/bin/env node

/**
 * Test Enhanced Orchestrator fallback to show it works
 */

import EnhancedOrchestrator from './src/orchestration/enhanced-orchestrator.js';

const mockEnv = {};

const testJob = {
  id: 'test-fallback',
  processData: {
    processDescription: 'Customer support emails need classification and tracking',
    businessContext: {
      industry: 'Customer Support',
      department: 'Operations'
    }
  },
  automationOpportunities: [
    {
      stepDescription: 'AI email classification',
      automationSolution: 'ai_email_processing',
      priority: 'high'
    }
  ]
};

async function testFallback() {
  console.log('🧪 Testing Enhanced Orchestrator Fallback (No MCP)');
  console.log('=' .repeat(60));
  
  const orchestrator = new EnhancedOrchestrator(mockEnv);
  
  try {
    // This will fail to initialize MCP and use fallback
    const initialized = await orchestrator.initialize();
    console.log('✅ Initialization result:', initialized);
    
    // But the sophisticated fallback should still work
    console.log('\\n🧠 Creating orchestration plan with sophisticated fallback...');
    const plan = orchestrator.createFallbackSophisticatedPlan(testJob);
    
    console.log('✅ ENHANCED ORCHESTRATOR FALLBACK PLAN:');
    console.log('📊 Name:', plan.workflowName);
    console.log('🔧 Steps:', plan.steps.length);
    console.log('⚡ Triggers:', plan.triggers.length);
    console.log('');
    console.log('🔧 Step Flow:');
    plan.steps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step.name} (${step.type})`);
    });
    
    // Save the sophisticated fallback plan
    const fs = await import('fs');
    fs.writeFileSync('enhanced-orchestrator-fallback-plan.json', JSON.stringify(plan, null, 2));
    console.log('\\n💾 Fallback plan saved to: enhanced-orchestrator-fallback-plan.json');
    console.log('🎯 This shows what the Enhanced Orchestrator creates even without MCP!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await orchestrator.cleanup();
  }
}

testFallback().catch(console.error);