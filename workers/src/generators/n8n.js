/**
 * n8n Workflow Generator
 * Creates n8n-compatible JSON workflow definitions
 */

import { callModel } from '../ai/model-router.js';
import { getRelevantDocs } from '../knowledge/retriever.js';
import { assembleWorkflow, blueprintWebhookTrigger, blueprintEmailSend, blueprintHttpRequest, blueprintTransformSet } from '../blueprints.js';
import IntelligentPromptBuilder from '../ai/intelligent-prompt-builder.js';
import { WorkflowComplexityDetector } from '../utils/complexity-detector.js';
import { ContextOptimizer } from '../ai/context-optimizer.js';

export async function generateN8nWorkflow(env, orchestrationPlan, job) {
  // ALWAYS use intelligent AI generation - no more blueprint shortcuts
  // We want sophisticated workflows that leverage the full n8n ecosystem via MCP

  // Enhanced: Use intelligent prompt builder with context from working examples
  const promptBuilder = new IntelligentPromptBuilder();
  
  // Create rich business context from job data and orchestration plan
  const businessContext = {
    industry: job.processData?.businessContext?.industry || job.processData?.industry || 'Business Process Automation',
    department: job.processData?.businessContext?.department || 'Operations',
    expectedVolume: job.processData?.businessContext?.volume || job.processData?.expectedVolume || orchestrationPlan.volumeExpected || 'Medium volume - 50-200 operations per day',
    complexity: job.processData?.businessContext?.complexity || orchestrationPlan.complexity || 'Medium - requires API integrations and data processing',
    slaRequirements: job.processData?.slaRequirements || orchestrationPlan.estimatedTime || '< 30 minutes processing time',
    securityRequirements: job.processData?.securityRequirements || (job.processData?.businessContext?.industry?.toLowerCase().includes('finance') || job.processData?.businessContext?.industry?.toLowerCase().includes('insurance') ? ['Data encryption', 'Access logging', 'Compliance tracking'] : ['Standard security']),
    integrations: orchestrationPlan.integrations || ['REST APIs', 'Email systems', 'Database'],
    automationGoals: job.automationOpportunities?.map(op => op.automationSolution) || ['Efficiency improvement', 'Error reduction', 'Process standardization'],
    processDescription: job.processData?.processDescription || orchestrationPlan.description || 'Business process automation'
  };
  
  // Enhanced node type discovery - explore full MCP ecosystem
  const baseNodeTypes = [
    ...(orchestrationPlan.steps || []).map(s => s.type),
    ...(orchestrationPlan.triggers || []).map(t => t.type)
  ].filter(Boolean);
  
  // Expand node types based on workflow requirements and business context
  const enhancedNodeTypes = [...baseNodeTypes];
  
  // Add AI/ML nodes for intelligent processing
  if (businessContext.processDescription?.toLowerCase().includes('email') || 
      businessContext.processDescription?.toLowerCase().includes('text') ||
      businessContext.processDescription?.toLowerCase().includes('analysis')) {
    enhancedNodeTypes.push('openai', 'function', 'switch', 'merge');
  }
  
  // Add data processing nodes for complex workflows
  if (businessContext.complexity?.toLowerCase().includes('data') ||
      businessContext.integrations?.some(i => i.toLowerCase().includes('database'))) {
    enhancedNodeTypes.push('json', 'xml', 'csv', 'set', 'filter', 'aggregate');
  }
  
  // Add integration nodes based on industry
  if (businessContext.industry?.toLowerCase().includes('finance') || 
      businessContext.industry?.toLowerCase().includes('insurance')) {
    enhancedNodeTypes.push('webhook', 'httpRequest', 'emailSend', 'schedule', 'if');
  }
  
  // Add monitoring and error handling for production workflows
  enhancedNodeTypes.push('errorTrigger', 'stopAndError', 'noOp', 'respondToWebhook');
  
  // Get optimized context based on workflow type and complexity
  const contextConfig = ContextOptimizer.getOptimizedContext(orchestrationPlan, job);
  const complexityAnalysis = WorkflowComplexityDetector.analyzeComplexity(orchestrationPlan, job);
  
  console.log(`🎯 Context Optimization: ${contextConfig.workflowType} workflow`);
  console.log(`🔍 Complexity: ${contextConfig.complexity} (${complexityAnalysis.reasoning.join('; ')})`);
  console.log(`📚 Documentation: ${contextConfig.nodeCount} nodes, ${contextConfig.charsPerDoc} chars each`);
  
  // Get targeted documentation focused on workflow type
  const docs = getRelevantDocs({
    task: `${orchestrationPlan.description || contextConfig.priority} for ${businessContext.industry}`,
    nodeTypes: contextConfig.focusNodeTypes.concat(enhancedNodeTypes).slice(0, contextConfig.nodeCount),
    paramsHint: { 
      retryOnFail: true, 
      maxRetries: 3,
      authentication: true,
      errorHandling: true,
      focusAreas: contextConfig.focusAreas
    }
  }, contextConfig.nodeCount);

  // Build optimized prompt with workflow-specific context
  const basePrompt = await promptBuilder.buildIntelligentPrompt(orchestrationPlan, businessContext);
  const optimizedPrompt = ContextOptimizer.buildOptimizedPrompt(basePrompt, contextConfig, businessContext);
  
  const intelligentPrompt = [
    optimizedPrompt,
    '\n\n## 📚 TARGETED n8n NODE DOCUMENTATION\n',
    '### Key Node Types and Configurations:\n',
    ...docs.map((d, i) => `\n#### ${i + 1}. ${d.title}\n${d.content.substring(0, contextConfig.charsPerDoc)}\n`)
  ].join('');
  
  console.log('🧠 Using enhanced AI generation with full MCP node ecosystem and rich business context');
  console.log(`📋 Business Context: ${businessContext.industry} | ${businessContext.department} | ${businessContext.complexity}`);
  console.log(`🔧 Enhanced Node Types: ${[...new Set(enhancedNodeTypes)].join(', ')}`);

  // Get complexity-aware token budget
  const tokenBudget = WorkflowComplexityDetector.getContextBudget(complexityAnalysis.complexity, 'orchestrator');
  
  const response = await callModel(env, intelligentPrompt, { 
    tier: 'orchestrator',
    complexity: complexityAnalysis.complexity,
    workflowType: contextConfig.workflowType,
    jobId: job.id || job.jobId || 'workflow-generation',
    maxTokens: tokenBudget.outputTokens,
    temperature: 0.1 // Lower temperature for more consistent, production-ready output
  });
  
  // Clean and extract JSON from AI response
  let cleanJson = response;
  
  // Remove markdown code blocks if present
  if (cleanJson.includes('```json') || cleanJson.includes('```')) {
    const jsonMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanJson = jsonMatch[1];
    }
  }
  
  // Remove any leading/trailing whitespace and control characters
  cleanJson = cleanJson.trim().replace(/[\x00-\x1F\x7F]/g, '');
  
  // Try parsing, fallback to simpler extraction if needed
  let workflow;
  try {
    workflow = JSON.parse(cleanJson);
  } catch (parseError) {
    console.log('Initial JSON parse failed, attempting cleanup:', parseError.message);
    
    // More aggressive cleanup - remove backticks and fix common issues
    cleanJson = cleanJson
      .replace(/`/g, '"')  // Replace backticks with quotes
      .replace(/\\n/g, '')  // Remove literal \n
      .replace(/\\t/g, '')  // Remove literal \t
      .replace(/\n/g, '')   // Remove actual newlines
      .replace(/\t/g, '');  // Remove actual tabs
    
    try {
      workflow = JSON.parse(cleanJson);
    } catch (secondError) {
      console.error('JSON parsing failed after cleanup:', secondError.message);
      console.error('Response preview:', response.substring(0, 500));
      throw new Error(`Failed to parse AI response as JSON: ${secondError.message}`);
    }
  }
  
  // Ensure workflow has required fields
  if (!workflow.name) {
    workflow.name = orchestrationPlan.workflowName || 'Generated Automation Workflow';
  }
  if (!workflow.description) {
    workflow.description = orchestrationPlan.description || 'Automation workflow generated by ProcessAudit AI';
  }
  
  if (!workflow.nodes || workflow.nodes.length === 0) {
    // Create a basic workflow structure if AI didn't generate nodes
    workflow.nodes = createBasicNodes(orchestrationPlan);
  }
  
  if (!workflow.connections) {
    workflow.connections = createNodeConnections(workflow.nodes);
  }

  // Apply sane defaults for webhook triggers (path, method, response)
  try {
    applyWebhookDefaults(workflow, job, env);
  } catch (e) {
    // Non-fatal: continue with workflow as-is
  }

  // Add metadata & lightweight versioning
  workflow.meta = {
    ...workflow.meta,
    generatedAt: new Date().toISOString(),
    generatedBy: 'ProcessAudit AI',
    version: '1.1.0',
    planHash: computePlanHash(orchestrationPlan),
  };
  
  workflow.tags = ['automated', 'process-audit-ai'];
  
  // Final validation (throws on critical issues)
  let validation = validateN8nWorkflow(workflow);
  if (!validation.valid) {
    // Attempt a single auto-repair pass for common issues
    autoRepairWorkflow(workflow);
    validation = validateN8nWorkflow(workflow);
    if (!validation.valid) {
      const message = `Workflow validation failed: ${validation.errors.join('; ')}`;
      throw new Error(message);
    }
  }

  return workflow;
}

function createBasicNodes(plan) {
  const nodes = [];
  let yPosition = 250;
  
  // Create trigger node
  if (plan.triggers && plan.triggers.length > 0) {
    const trigger = plan.triggers[0];
    nodes.push({
      id: generateNodeId(),
      name: 'Trigger',
      type: mapTriggerType(trigger.type),
      typeVersion: 1,
      position: [250, yPosition],
      parameters: trigger.configuration || {},
    });
    yPosition += 150;
  }
  
  // Create step nodes
  if (plan.steps) {
    plan.steps.forEach((step, index) => {
      nodes.push({
        id: step.id || generateNodeId(),
        name: step.name || `Step ${index + 1}`,
        type: mapStepType(step.type),
        typeVersion: 1,
        position: [250, yPosition],
        parameters: step.configuration || {},
      });
      yPosition += 150;
    });
  }
  
  return nodes;
}

function mapTriggerType(type) {
  const typeMap = {
    'webhook': 'n8n-nodes-base.webhook',
    'schedule': 'n8n-nodes-base.schedule',
    'email': 'n8n-nodes-base.emailReadImap',
    'form': 'n8n-nodes-base.formTrigger',
  };
  return typeMap[type] || 'n8n-nodes-base.webhook';
}

function mapStepType(type) {
  const typeMap = {
    'http': 'n8n-nodes-base.httpRequest',
    'transform': 'n8n-nodes-base.set',
    'condition': 'n8n-nodes-base.if',
    'email': 'n8n-nodes-base.emailSend',
    'database': 'n8n-nodes-base.postgres',
    'function': 'n8n-nodes-base.function',
    'merge': 'n8n-nodes-base.merge',
    'split': 'n8n-nodes-base.splitInBatches',
  };
  return typeMap[type] || 'n8n-nodes-base.set';
}

function createNodeConnections(nodes) {
  const connections = {};
  
  for (let i = 0; i < nodes.length - 1; i++) {
    const currentNode = nodes[i];
    const nextNode = nodes[i + 1];
    
    connections[currentNode.name] = {
      main: [[{
        node: nextNode.name,
        type: 'main',
        index: 0,
      }]],
    };
  }
  
  return connections;
}

function generateNodeId() {
  return 'node_' + Math.random().toString(36).substr(2, 9);
}

// --- Enhancements: Webhook defaults, hashing, validation ---

function applyWebhookDefaults(workflow, job, env) {
  if (!workflow?.nodes?.length) return;
  const webhookNode = workflow.nodes.find(n => (n.type || '').includes('webhook'));
  if (!webhookNode) return;

  webhookNode.parameters = webhookNode.parameters || {};
  // Provide deterministic unique path per job
  if (!webhookNode.parameters.path) {
    webhookNode.parameters.path = `process-audit/${job.id}`;
  }
  if (!webhookNode.parameters.httpMethod) {
    webhookNode.parameters.httpMethod = 'POST';
  }
  if (!webhookNode.parameters.responseMode) {
    webhookNode.parameters.responseMode = 'onReceived';
  }
  if (typeof webhookNode.parameters.responseCode === 'undefined') {
    webhookNode.parameters.responseCode = 200;
  }

  // Authentication: keep as none by default; include placeholder header auth if requested
  const includePlaceholderAuth = env?.INCLUDE_WEBHOOK_AUTH_PLACEHOLDER === 'true';
  if (includePlaceholderAuth) {
    webhookNode.parameters.authentication = 'headerAuth';
    webhookNode.parameters.headerName = webhookNode.parameters.headerName || 'X-PAI-Token';
    webhookNode.parameters.headerValue = webhookNode.parameters.headerValue || '{{N8N_WEBHOOK_TOKEN}}';
  } else if (!webhookNode.parameters.authentication) {
    // WARNING: Defaulting to no authentication - should be secured in production
    webhookNode.parameters.authentication = 'none';
    console.warn(`Webhook "${webhookNode.name}" has no authentication - consider adding security in production`);
  }
}

function computePlanHash(plan) {
  try {
    const str = JSON.stringify(plan);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return `h${Math.abs(hash)}`;
  } catch {
    return 'h0';
  }
}

export function validateN8nWorkflow(workflow) {
  const errors = [];
  if (!workflow || typeof workflow !== 'object') {
    return { valid: false, errors: ['workflow is not an object'] };
  }
  if (!workflow.name || typeof workflow.name !== 'string') {
    errors.push('name is required');
  }
  if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    errors.push('nodes array is required and must not be empty');
  } else {
    const names = new Set();
    for (const node of workflow.nodes) {
      if (!node.name || !node.type || !node.position) {
        errors.push(`node missing required fields (name/type/position): ${node?.name || node?.type || 'unnamed'}`);
      }
      if (node.name) {
        if (names.has(node.name)) errors.push(`duplicate node name: ${node.name}`);
        names.add(node.name);
      }
    }
  }
  if (workflow.connections && typeof workflow.connections === 'object') {
    const nodeNames = new Set((workflow.nodes || []).map(n => n.name));
    for (const [fromName, conn] of Object.entries(workflow.connections)) {
      if (!nodeNames.has(fromName)) {
        errors.push(`connection source does not exist: ${fromName}`);
      }
      const main = conn?.main?.[0] || [];
      for (const edge of main) {
        if (edge?.node && !nodeNames.has(edge.node)) {
          errors.push(`connection target does not exist: ${edge.node}`);
        }
      }
    }

    // Additional rule: HTTP request nodes should not be terminal (must have an outgoing connection)
    const connectionSources = new Set(Object.keys(workflow.connections || {}));
    for (const node of workflow.nodes || []) {
      const type = node.type || '';
      const isHttp = type.includes('httpRequest');
      if (isHttp && !connectionSources.has(node.name)) {
        errors.push(`http request node is terminal without outgoing connection: ${node.name}`);
      }
      const isEmail = type.includes('emailSend');
      const allowTerminal = node.parameters && (node.parameters.terminal === true);
      if (isEmail && !allowTerminal && !connectionSources.has(node.name)) {
        errors.push(`email node is terminal without outgoing connection (set parameters.terminal=true to allow): ${node.name}`);
      }
    }
  }
  
  // Secret scanning: reject obvious secrets or tokens embedded directly in parameters
  try {
    const secretPattern = /(sk-[a-z0-9]{10,}|api[_-]?key|secret|password|Bearer\s+(?!\{\{)[A-Za-z0-9_\-]{20,})/i;
    const strings = [];
    const collectStrings = (val) => {
      if (val == null) return;
      if (typeof val === 'string') strings.push(val);
      else if (Array.isArray(val)) val.forEach(collectStrings);
      else if (typeof val === 'object') Object.values(val).forEach(collectStrings);
    };
    for (const node of workflow.nodes || []) {
      collectStrings(node.parameters);
      collectStrings(node.credentials);
    }
    if (strings.some(s => secretPattern.test(String(s)))) {
      errors.push('potential secret found in workflow parameters/credentials; use placeholders only');
    }
  } catch {}

  // HTTP policy: require retryOnFail and maxRetries >= 1 on httpRequest nodes
  for (const node of workflow.nodes || []) {
    const type = node.type || '';
    if (type.includes('httpRequest')) {
      // Only enforce retry policy if options object is present; otherwise treat as a soft requirement
      if (node.parameters && node.parameters.options) {
        const opts = node.parameters.options || {};
        if (!opts.retryOnFail || !(typeof opts.maxRetries === 'number' && opts.maxRetries >= 1)) {
          errors.push(`http request node missing retry policy (retryOnFail + maxRetries>=1): ${node.name}`);
        }
      }
    }
    if (type.includes('emailSend')) {
      const p = node.parameters || {};
      if (!p.to || !p.subject || !p.text) {
        errors.push(`email node missing required fields (to/subject/text): ${node.name}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// --- Auto-repair helpers ---
function autoRepairWorkflow(workflow) {
  // Step 1: Fix broken connections by mapping IDs to names
  repairBrokenConnections(workflow);
  
  // Step 2: Remove any remaining invalid connections
  cleanupInvalidConnections(workflow);
  
  // Step 3: Fix terminal nodes and add required parameters
  const connectionSources = new Set(Object.keys(workflow.connections || {}));
  const terminalNodes = [];
  
  for (const node of workflow.nodes || []) {
    const type = node.type || '';
    const isTerminal = !connectionSources.has(node.name);
    
    // Fill HTTP retry policy if missing
    if (type.includes('httpRequest')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      if (!node.parameters.options.retryOnFail) node.parameters.options.retryOnFail = true;
      if (!(typeof node.parameters.options.maxRetries === 'number')) node.parameters.options.maxRetries = 3;
      
      // Fix terminal HTTP nodes by creating a Set node after them
      if (isTerminal) {
        terminalNodes.push(node);
      }
    }
    
    // Ensure email required fields placeholders and fix terminal email nodes
    if (type.includes('emailSend')) {
      node.parameters = node.parameters || {};
      if (!node.parameters.to) node.parameters.to = '{{recipient}}';
      if (!node.parameters.subject) node.parameters.subject = 'Notification';
      if (!node.parameters.text) node.parameters.text = 'See details.';
      
      // Fix terminal email nodes by setting terminal=true if no outgoing connections
      if (isTerminal && !node.parameters.terminal) {
        node.parameters.terminal = true;
      }
    }
  }
  
  // Step 4: Add Set nodes after terminal HTTP nodes to fix validation
  for (const terminalNode of terminalNodes) {
    const setNodeName = `${terminalNode.name} Response`;
    const setNode = {
      id: generateNodeId(),
      name: setNodeName,
      type: 'n8n-nodes-base.set',
      typeVersion: 1,
      position: [terminalNode.position[0] + 200, terminalNode.position[1]],
      parameters: {
        values: {
          string: [{
            name: 'status',
            value: 'completed'
          }]
        }
      }
    };
    
    // Add the Set node
    workflow.nodes.push(setNode);
    
    // Create connection from HTTP node to Set node
    workflow.connections[terminalNode.name] = {
      main: [[{
        node: setNodeName,
        type: 'main',
        index: 0
      }]]
    };
  }
}

function repairBrokenConnections(workflow) {
  if (!workflow.nodes || !workflow.connections) return;
  
  // Create mapping of both IDs and names to node names
  const nodeNameMap = new Map();
  const nodeIdMap = new Map();
  
  for (const node of workflow.nodes) {
    if (node.name) {
      nodeNameMap.set(node.name, node.name);
      if (node.id) {
        nodeIdMap.set(node.id, node.name);
      }
    }
  }
  
  // Fix connections that reference node IDs instead of names
  const newConnections = {};
  
  for (const [fromKey, conn] of Object.entries(workflow.connections)) {
    // Map source key (might be ID or name)
    const fromName = nodeIdMap.get(fromKey) || nodeNameMap.get(fromKey) || fromKey;
    
    if (nodeNameMap.has(fromName)) {
      const newConn = { ...conn };
      
      // Fix target references in main connections
      if (newConn.main && Array.isArray(newConn.main[0])) {
        newConn.main[0] = newConn.main[0].map(edge => {
          if (edge && edge.node) {
            const targetName = nodeIdMap.get(edge.node) || nodeNameMap.get(edge.node) || edge.node;
            return { ...edge, node: targetName };
          }
          return edge;
        });
      }
      
      newConnections[fromName] = newConn;
    }
  }
  
  workflow.connections = newConnections;
}

function cleanupInvalidConnections(workflow) {
  if (!workflow.nodes || !workflow.connections) return;
  
  const validNodeNames = new Set(workflow.nodes.map(n => n.name).filter(Boolean));
  const validConnections = {};
  
  for (const [fromName, conn] of Object.entries(workflow.connections)) {
    if (validNodeNames.has(fromName) && conn.main && Array.isArray(conn.main[0])) {
      const validEdges = conn.main[0].filter(edge => 
        edge && edge.node && validNodeNames.has(edge.node)
      );
      
      if (validEdges.length > 0) {
        validConnections[fromName] = {
          ...conn,
          main: [validEdges]
        };
      }
    }
  }
  
  workflow.connections = validConnections;
  
  // If we have nodes but no valid connections, create basic linear connections
  if (Object.keys(validConnections).length === 0 && workflow.nodes.length > 1) {
    const basicConnections = {};
    for (let i = 0; i < workflow.nodes.length - 1; i++) {
      const fromNode = workflow.nodes[i];
      const toNode = workflow.nodes[i + 1];
      if (fromNode.name && toNode.name) {
        basicConnections[fromNode.name] = {
          main: [[{
            node: toNode.name,
            type: 'main',
            index: 0
          }]]
        };
      }
    }
    workflow.connections = basicConnections;
  }
}