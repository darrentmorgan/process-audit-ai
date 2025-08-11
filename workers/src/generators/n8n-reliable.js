/**
 * Reliable n8n Workflow Generator
 * Focuses on generating valid, tested workflows with proper validation
 */

import { callModel } from '../ai/model-router.js';
import { WorkflowComplexityDetector } from '../utils/complexity-detector.js';

// Comprehensive n8n node type registry with proper parameters
const N8N_NODE_REGISTRY = {
  // Trigger nodes
  'webhook': {
    type: 'n8n-nodes-base.webhook',
    typeVersion: 1,
    defaultParams: {
      httpMethod: 'POST',
      path: 'webhook',
      responseMode: 'onReceived'
    }
  },
  'gmail-trigger': {
    type: 'n8n-nodes-base.gmailTrigger', 
    typeVersion: 1,
    defaultParams: {
      pollTimes: { item: [{ mode: 'everyMinute' }] },
      simple: true,
      filters: {}
    },
    requiredCredentials: ['gmailOAuth2Api']
  },
  'schedule': {
    type: 'n8n-nodes-base.schedule',
    typeVersion: 1,
    defaultParams: {
      rule: { interval: [{ field: 'cronExpression', expression: '0 * * * *' }] }
    }
  },

  // Action nodes  
  'gmail-send': {
    type: 'n8n-nodes-base.gmail',
    typeVersion: 2,
    defaultParams: {
      operation: 'send',
      resource: 'message'
    },
    requiredCredentials: ['gmailOAuth2Api']
  },
  'google-sheets': {
    type: 'n8n-nodes-base.googleSheets',
    typeVersion: 4,
    defaultParams: {
      operation: 'append',
      options: { valueInputMode: 'RAW' }
    },
    requiredCredentials: ['googleSheetsOAuth2Api']
  },
  'airtable': {
    type: 'n8n-nodes-base.airtable',
    typeVersion: 1,
    defaultParams: {
      operation: 'create',
      options: { typecast: true }
    },
    requiredCredentials: ['airtableApi']
  },
  'openai': {
    type: 'n8n-nodes-base.openAi',
    typeVersion: 1,
    defaultParams: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    },
    requiredCredentials: ['openAiApi']
  },
  'function': {
    type: 'n8n-nodes-base.function',
    typeVersion: 1,
    defaultParams: {
      functionCode: '// Process the input data\nreturn items;'
    }
  },
  'merge': {
    type: 'n8n-nodes-base.merge',
    typeVersion: 2,
    defaultParams: {
      mode: 'waitForAll',
      options: {}
    }
  },
  'http': {
    type: 'n8n-nodes-base.httpRequest', 
    typeVersion: 4,
    defaultParams: {
      method: 'GET',
      options: {}
    }
  },
  'switch': {
    type: 'n8n-nodes-base.switch',
    typeVersion: 1,
    defaultParams: {
      rules: { values: [] }
    }
  }
};

// Workflow templates for common patterns
const WORKFLOW_TEMPLATES = {
  'email-automation': {
    name: 'Email Processing Automation',
    pattern: ['gmail-trigger', 'function', 'openai', 'gmail-send'],
    description: 'Automated email processing with AI responses'
  },
  'data-sync': {
    name: 'Multi-Platform Data Sync',
    pattern: ['webhook', 'function', ['google-sheets', 'airtable'], 'merge'],
    description: 'Sync data to multiple platforms in parallel'
  },
  'ai-classification': {
    name: 'AI Content Classification',
    pattern: ['webhook', 'openai', 'switch', ['action1', 'action2', 'action3']],
    description: 'AI-powered content classification with conditional routing'
  }
};

/**
 * Generate reliable n8n workflow with validation
 */
export async function generateReliableN8nWorkflow(env, orchestrationPlan, job) {
  console.log('🔧 Generating reliable n8n workflow...');
  
  try {
    // Step 1: Determine workflow pattern
    const pattern = determineWorkflowPattern(orchestrationPlan, job);
    console.log('📋 Detected pattern:', pattern.name);
    
    // Step 2: Generate workflow structure
    const workflowStructure = await generateWorkflowStructure(env, pattern, orchestrationPlan, job);
    
    // Step 3: Create validated nodes
    const nodes = createValidatedNodes(workflowStructure);
    
    // Step 4: Create proper connections
    const connections = createReliableConnections(nodes, workflowStructure.flow);
    
    // Step 5: Validate complete workflow
    const workflow = {
      name: workflowStructure.name,
      nodes,
      connections,
      settings: {
        executionOrder: 'v1',
        saveManualExecutions: true,
        callerPolicy: 'workflowCredentialUser'
      },
      staticData: {},
      pinData: {},
      versionId: '1',
      meta: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'ProcessAudit AI - Reliable Generator',
        validated: true
      },
      description: workflowStructure.description,
      tags: ['automated', 'process-audit-ai', 'reliable']
    };
    
    // Step 6: Final validation
    const validation = validateCompleteWorkflow(workflow);
    if (!validation.valid) {
      throw new Error(`Workflow validation failed: ${validation.errors.join('; ')}`);
    }
    
    console.log('✅ Reliable workflow generated successfully');
    return workflow;
    
  } catch (error) {
    console.error('❌ Reliable workflow generation failed:', error.message);
    throw error;
  }
}

function determineWorkflowPattern(orchestrationPlan, job) {
  const processDesc = job.processData?.processDescription?.toLowerCase() || '';
  
  // Email automation pattern
  if (processDesc.includes('email')) {
    return WORKFLOW_TEMPLATES['email-automation'];
  }
  
  // Multi-platform sync pattern  
  if (processDesc.includes('sheets') || processDesc.includes('airtable') || 
      orchestrationPlan.integrations?.length > 2) {
    return WORKFLOW_TEMPLATES['data-sync'];
  }
  
  // AI classification pattern
  if (processDesc.includes('categoriz') || processDesc.includes('classif') ||
      job.automationOpportunities?.some(op => op.automationSolution?.includes('ai'))) {
    return WORKFLOW_TEMPLATES['ai-classification'];
  }
  
  // Default to email automation
  return WORKFLOW_TEMPLATES['email-automation'];
}

async function generateWorkflowStructure(env, template, orchestrationPlan, job) {
  const prompt = `Create a detailed n8n workflow structure based on this template and requirements:

TEMPLATE: ${template.name}
PATTERN: ${JSON.stringify(template.pattern)}

BUSINESS REQUIREMENTS:
${JSON.stringify({
  process: job.processData?.processDescription,
  opportunities: job.automationOpportunities,
  plan: orchestrationPlan
}, null, 2)}

Generate a JSON structure with:
{
  "name": "Workflow name",
  "description": "Detailed description", 
  "flow": [
    {
      "nodeType": "gmail-trigger",
      "name": "Email Trigger",
      "params": { "specific": "parameters" },
      "position": [x, y]
    }
  ],
  "parallelBranches": [
    { "from": "nodeIndex", "branches": ["node1", "node2"], "mergeAt": "nodeIndex" }
  ]
}

Use only these valid nodeTypes: ${Object.keys(N8N_NODE_REGISTRY).join(', ')}
Keep response under 2000 tokens.`;

  // Analyze complexity for optimal model selection
  const complexityAnalysis = WorkflowComplexityDetector.analyzeComplexity(orchestrationPlan, job);
  const tokenBudget = WorkflowComplexityDetector.getContextBudget(complexityAnalysis.complexity, 'orchestrator');
  
  console.log(`🔍 Reliable Generator - Complexity: ${complexityAnalysis.complexity} (score: ${complexityAnalysis.score})`);
  console.log(`💡 Reasoning: ${complexityAnalysis.reasoning.join('; ')}`);
  
  const response = await callModel(env, prompt, { 
    tier: 'orchestrator',
    complexity: complexityAnalysis.complexity,
    maxTokens: tokenBudget.outputTokens,
    temperature: 0.1 
  });
  
  return JSON.parse(response);
}

function createValidatedNodes(structure) {
  const nodes = [];
  
  structure.flow.forEach((nodeSpec, index) => {
    const registry = N8N_NODE_REGISTRY[nodeSpec.nodeType];
    if (!registry) {
      throw new Error(`Unknown node type: ${nodeSpec.nodeType}`);
    }
    
    const node = {
      id: `node-${nodeSpec.nodeType}-${generateId()}`,
      name: nodeSpec.name,
      type: registry.type,
      typeVersion: registry.typeVersion,
      position: nodeSpec.position || [100 + (index * 200), 300],
      parameters: {
        ...registry.defaultParams,
        ...nodeSpec.params
      }
    };
    
    // Add credentials if required
    if (registry.requiredCredentials) {
      node.credentials = {};
      registry.requiredCredentials.forEach(cred => {
        node.credentials[cred] = { id: '1', name: cred.replace('Api', ' Account') };
      });
    }
    
    // Add retry logic for important nodes
    if (['gmail-send', 'google-sheets', 'airtable'].includes(nodeSpec.nodeType)) {
      node.continueOnFail = true;
      node.retryOnFail = true;
      node.maxRetries = 3;
    }
    
    nodes.push(node);
  });
  
  return nodes;
}

function createReliableConnections(nodes, flowSpec) {
  const connections = {};
  
  // Create sequential connections
  for (let i = 0; i < flowSpec.length - 1; i++) {
    const current = nodes[i];
    const next = nodes[i + 1];
    
    if (!connections[current.name]) {
      connections[current.name] = { main: [] };
    }
    
    connections[current.name].main.push([{
      node: next.name,
      type: 'main',
      index: 0
    }]);
  }
  
  // Handle parallel branches (if specified in structure)
  // This would be implemented based on parallelBranches array
  
  return connections;
}

function validateCompleteWorkflow(workflow) {
  const errors = [];
  
  // Validate basic structure
  if (!workflow.name) errors.push('Missing workflow name');
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) errors.push('Missing nodes array');
  if (!workflow.connections || typeof workflow.connections !== 'object') errors.push('Missing connections object');
  
  // Validate nodes
  workflow.nodes?.forEach((node, index) => {
    if (!node.id) errors.push(`Node ${index} missing id`);
    if (!node.name) errors.push(`Node ${index} missing name`);  
    if (!node.type) errors.push(`Node ${index} missing type`);
    if (!node.typeVersion) errors.push(`Node ${index} missing typeVersion`);
    if (!Array.isArray(node.position) || node.position.length !== 2) {
      errors.push(`Node ${index} invalid position`);
    }
  });
  
  // Validate connections reference existing nodes
  const nodeNames = new Set(workflow.nodes?.map(n => n.name) || []);
  Object.entries(workflow.connections || {}).forEach(([fromNode, connections]) => {
    if (!nodeNames.has(fromNode)) {
      errors.push(`Connection references unknown source node: ${fromNode}`);
    }
    
    connections.main?.forEach(branch => {
      branch?.forEach(conn => {
        if (!nodeNames.has(conn.node)) {
          errors.push(`Connection references unknown target node: ${conn.node}`);
        }
      });
    });
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function generateId() {
  return Math.random().toString(36).substring(2, 8);
}

export function validateN8nWorkflow(workflow) {
  return validateCompleteWorkflow(workflow);
}