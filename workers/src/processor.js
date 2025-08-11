/**
 * Job Processor for Automation Generation
 * Handles the orchestration and generation of n8n workflows
 */

import { generateN8nWorkflow, validateN8nWorkflow } from './generators/n8n';
import { generateReliableN8nWorkflow } from './generators/n8n-reliable.js';
import { generateN8nWorkflowHybrid } from './generators/n8n-mcp.js';
import { updateJobProgress, saveAutomation } from './database';
import { callModel } from './ai/model-router.js';
import { ORCHESTRATION_PLAN_SCHEMA } from './schemas';
import { ORCHESTRATOR_PROMPT_TEMPLATE } from './prompts';
import EnhancedOrchestrator from './orchestration/enhanced-orchestrator.js';

export async function processAutomationJob(env, job) {
  // Normalize job ID (could be job.id or job.jobId)
  const jobId = job.id || job.jobId;
  
  try {
    // Update job status to processing
    await updateJobProgress(env, jobId, 10, 'processing');

    // Step 1: Create sophisticated orchestration plan with Enhanced Orchestrator
    console.log('🧠 Creating sophisticated orchestration plan with MCP integration...');
    const orchestrator = new EnhancedOrchestrator(env);
    
    let orchestrationPlan;
    try {
      // Try enhanced orchestration with MCP integration
      const initialized = await orchestrator.initialize();
      if (initialized) {
        orchestrationPlan = await orchestrator.createSophisticatedOrchestrationPlan(job);
        console.log('✅ Enhanced orchestration plan created with MCP integration');
      } else {
        throw new Error('Enhanced orchestrator initialization failed');
      }
    } catch (error) {
      console.warn('⚠️ Enhanced orchestration failed, using fallback:', error.message);
      orchestrationPlan = await createOrchestrationPlan(env, job);
    } finally {
      await orchestrator.cleanup();
    }
    
    await updateJobProgress(env, jobId, 30, 'processing');

    // Step 2: Generate platform-specific workflow (n8n for now)
    console.log('Generating n8n workflow...');
    
    let workflow;
    try {
      // Try reliable generator first (new approach)
      console.log('🔧 Using reliable n8n generator...');
      workflow = await generateReliableN8nWorkflow(env, orchestrationPlan, job);
    } catch (error) {
      console.warn('⚠️ Reliable generator failed, using hybrid fallback:', error.message);
      // Fallback to hybrid approach: MCP-enhanced if available, fallback to legacy
      workflow = await generateN8nWorkflowHybrid(env, orchestrationPlan, job);
    }

    // Validate generated workflow before saving
    const validation = validateN8nWorkflow(workflow);
    if (!validation.valid) {
      throw new Error(`n8n workflow validation failed: ${validation.errors.join('; ')}`);
    }
    await updateJobProgress(env, jobId, 70, 'processing');

    // Step 3: Save the generated automation
    console.log('Saving automation...');
    const automation = {
      name: workflow.name,
      description: workflow.description,
      platform: 'n8n',
      workflow_json: workflow,
      instructions: generateInstructions(workflow),
    };
    
    await saveAutomation(env, jobId, automation);
    await updateJobProgress(env, jobId, 100, 'completed');

    console.log(`Job ${jobId} completed successfully`);
    return automation;

  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    await updateJobProgress(env, jobId, 0, 'failed', error.message);
    throw error;
  }
}

async function createOrchestrationPlan(env, job) {
  const prompt = `
You are an automation orchestration expert. Based on the following business process analysis, create a detailed automation plan that can be implemented in n8n.

Process Analysis:
${JSON.stringify(job.processData, null, 2)}

Automation Opportunities:
${JSON.stringify(job.automationOpportunities, null, 2)}

Create a structured plan with:
1. Workflow triggers (webhooks, schedules, etc.)
2. Data collection steps
3. Processing/transformation steps
4. Integration points with external systems
5. Error handling approach
6. Output/notification steps

Return a JSON object with this structure:
{
  "workflowName": "string",
  "description": "string",
  "triggers": [
    {
      "type": "webhook|schedule|email|form",
      "configuration": {}
    }
  ],
  "steps": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "description": "string",
      "inputs": [],
      "outputs": [],
      "configuration": {}
    }
  ],
  "connections": [
    {
      "from": "stepId",
      "to": "stepId"
    }
  ],
  "errorHandling": {
    "strategy": "string",
    "notifications": []
  }
}
`;

  // Prefer constrained plan first
  try {
    const constrained = ORCHESTRATOR_PROMPT_TEMPLATE(job.processData, job.automationOpportunities)
    const constrainedResp = await callModel(env, constrained, { tier: 'orchestrator', maxTokens: 4096, temperature: 0.2 })
    const constrainedPlan = JSON.parse(constrainedResp)
    // Minimal checks
    if (Array.isArray(constrainedPlan?.steps) && constrainedPlan.steps.length > 0) {
      return constrainedPlan
    }
  } catch (e) {
    // fall back to general prompt
  }

  const response = await callModel(env, prompt, { tier: 'orchestrator', maxTokens: 4096, temperature: 0.2 });
  const plan = JSON.parse(response);
  // Minimal schema conformance check (fast path). If it fails, throw for upstream handling.
  const errors = [];
  if (!plan || typeof plan !== 'object') errors.push('plan not an object');
  if (!plan.workflowName) errors.push('workflowName missing');
  if (!Array.isArray(plan.triggers) || plan.triggers.length === 0) errors.push('triggers missing');
  if (!Array.isArray(plan.steps) || plan.steps.length === 0) errors.push('steps missing');
  if (errors.length) {
    throw new Error(`Orchestration plan validation failed: ${errors.join('; ')}`);
  }
  return plan;
}

function generateInstructions(workflow) {
  const instructions = [];
  
  instructions.push('## How to Import This Workflow in n8n\n');
  instructions.push('1. Open your n8n instance');
  instructions.push('2. Click on "Workflows" in the left sidebar');
  instructions.push('3. Click the "Import" button');
  instructions.push('4. Select "From File" and upload the downloaded JSON file');
  instructions.push('5. Review and activate the workflow\n');
  
  instructions.push('## Configuration Required\n');
  instructions.push('After importing, you will need to:');
  
  // Add specific configuration steps based on workflow nodes
  if (workflow.nodes) {
    const uniqueTypes = [...new Set(workflow.nodes.map(n => n.type))];
    uniqueTypes.forEach(type => {
      if (type.includes('webhook')) {
        instructions.push('- Configure webhook URL and authentication');
      }
      if (type.includes('email')) {
        instructions.push('- Set up email credentials');
      }
      if (type.includes('database')) {
        instructions.push('- Configure database connection');
      }
      if (type.includes('api')) {
        instructions.push('- Add API keys and endpoints');
      }
    });
  }
  
  instructions.push('\n## Testing\n');
  instructions.push('1. Use the "Execute Workflow" button to test');
  instructions.push('2. Check the execution log for any errors');
  instructions.push('3. Adjust node settings as needed');
  
  return instructions.join('\n');
}