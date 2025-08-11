/**
 * Enhanced n8n Workflow Generator with MCP Integration
 * Uses the n8n MCP server for intelligent workflow creation
 */

import { N8nMCPClient } from '../mcp/n8n-client.js';
import { generateN8nWorkflow as generateLegacyWorkflow } from './n8n.js';

export async function generateN8nWorkflowMCP(env, orchestrationPlan, job) {
  const mcpClient = new N8nMCPClient(env);
  
  try {
    console.log("🚀 Starting MCP-enhanced n8n workflow generation");
    
    // Step 1: Connect to MCP server
    await mcpClient.connect();
    
    // Step 2: Build requirements from orchestration plan
    const requirements = buildRequirementsFromPlan(orchestrationPlan, job);
    console.log("📋 Built requirements:", requirements);
    
    // Step 3: Use MCP to build intelligent workflow
    const mcpResult = await mcpClient.buildIntelligentWorkflow(requirements);
    
    // Step 4: Enhance with existing business logic
    const enhancedWorkflow = enhanceWithBusinessLogic(mcpResult.workflow, orchestrationPlan, job);
    
    // Step 5: Final validation through MCP
    const finalValidation = await mcpClient.validateWorkflow(enhancedWorkflow);
    
    if (!finalValidation.valid) {
      throw new Error(`Final validation failed: ${finalValidation.errors?.join(', ')}`);
    }
    
    console.log("✅ MCP-enhanced workflow generated successfully");
    
    return {
      ...enhancedWorkflow,
      meta: {
        ...enhancedWorkflow.meta,
        mcpEnhanced: true,
        validation: finalValidation,
        generationMethod: 'mcp-intelligent'
      }
    };
    
  } catch (error) {
    console.error("❌ MCP workflow generation failed:", error);
    
    // Fallback to legacy generation
    console.log("🔄 Falling back to legacy workflow generation");
    const legacyWorkflow = await generateLegacyWorkflow(env, orchestrationPlan, job);
    
    return {
      ...legacyWorkflow,
      meta: {
        ...legacyWorkflow.meta,
        mcpEnhanced: false,
        fallbackUsed: true,
        fallbackReason: error.message,
        generationMethod: 'legacy-fallback'
      }
    };
    
  } finally {
    // Always cleanup MCP connection
    try {
      await mcpClient.disconnect();
    } catch (disconnectError) {
      console.error("Error disconnecting MCP client:", disconnectError);
    }
  }
}

function buildRequirementsFromPlan(orchestrationPlan, job) {
  const requirements = {
    name: orchestrationPlan.workflowName || 'Generated Workflow',
    functionality: orchestrationPlan.description || 'Process automation workflow',
    tasks: [],
    useAI: false,
    businessContext: {
      industry: job.processData?.industry || 'general',
      expectedVolume: job.processData?.expectedVolume || 'standard',
      slaRequirements: job.processData?.slaRequirements,
      securityRequirements: job.processData?.securityRequirements
    }
  };

  // Extract tasks from steps
  if (orchestrationPlan.steps && Array.isArray(orchestrationPlan.steps)) {
    requirements.tasks = orchestrationPlan.steps.map(step => ({
      type: step.type,
      description: step.description || step.name || `${step.type} operation`,
      configuration: step.configuration || {}
    }));
  }

  // Extract tasks from triggers
  if (orchestrationPlan.triggers && Array.isArray(orchestrationPlan.triggers)) {
    const triggerTasks = orchestrationPlan.triggers.map(trigger => ({
      type: trigger.type,
      description: trigger.description || trigger.name || `${trigger.type} trigger`,
      configuration: trigger.configuration || {}
    }));
    requirements.tasks = [...triggerTasks, ...requirements.tasks];
  }

  // Determine if AI capabilities are needed
  const aiKeywords = ['analyze', 'classify', 'summarize', 'extract', 'generate', 'ai', 'ml', 'intelligent'];
  requirements.useAI = aiKeywords.some(keyword => 
    orchestrationPlan.description?.toLowerCase().includes(keyword) ||
    requirements.tasks.some(task => task.description.toLowerCase().includes(keyword))
  );

  return requirements;
}

function enhanceWithBusinessLogic(mcpWorkflow, orchestrationPlan, job) {
  // Apply business-specific enhancements
  const enhanced = { ...mcpWorkflow };

  // Add retry policies to HTTP nodes
  enhanced.nodes = enhanced.nodes.map(node => {
    if (node.type && node.type.includes('httpRequest')) {
      return {
        ...node,
        parameters: {
          ...node.parameters,
          options: {
            ...node.parameters?.options,
            retryOnFail: true,
            maxRetries: 3,
            retryInterval: 1000
          }
        }
      };
    }
    return node;
  });

  // Add authentication placeholders
  enhanced.nodes = enhanced.nodes.map(node => {
    if (node.type && (node.type.includes('email') || node.type.includes('http'))) {
      return {
        ...node,
        credentials: {
          ...node.credentials,
          // Add environment variable references
          ...(node.type.includes('email') && {
            smtp: {
              id: "{{EMAIL_CREDENTIALS}}",
              name: "SMTP"
            }
          }),
          ...(node.type.includes('http') && {
            httpAuth: {
              id: "{{HTTP_CREDENTIALS}}",
              name: "HTTP Auth"
            }
          })
        }
      };
    }
    return node;
  });

  // Add webhook configuration for webhook triggers
  enhanced.nodes = enhanced.nodes.map(node => {
    if (node.type && node.type.includes('webhook')) {
      return {
        ...node,
        parameters: {
          ...node.parameters,
          path: `process-audit/${job.id}`,
          httpMethod: 'POST',
          responseMode: 'onReceived',
          responseCode: 200,
          authentication: 'none'
        }
      };
    }
    return node;
  });

  // Ensure terminal email nodes are properly configured
  enhanced.nodes = enhanced.nodes.map(node => {
    if (node.type && node.type.includes('emailSend')) {
      // Check if this node has outgoing connections
      const hasOutgoingConnections = Object.keys(enhanced.connections || {}).includes(node.name);
      
      if (!hasOutgoingConnections) {
        return {
          ...node,
          parameters: {
            ...node.parameters,
            terminal: true
          }
        };
      }
    }
    return node;
  });

  // Add business context to metadata
  enhanced.meta = {
    ...enhanced.meta,
    businessContext: {
      industry: job.processData?.industry || 'general',
      expectedVolume: job.processData?.expectedVolume || 'standard',
      processDescription: orchestrationPlan.description
    },
    enhancements: [
      'HTTP retry policies added',
      'Authentication placeholders configured',
      'Webhook paths configured',
      'Terminal email nodes fixed'
    ]
  };

  return enhanced;
}

// Hybrid approach: try MCP first, fall back to legacy
export async function generateN8nWorkflowHybrid(env, orchestrationPlan, job) {
  // Check if MCP should be attempted
  const shouldUseMCP = shouldAttemptMCP(orchestrationPlan, env);
  
  if (shouldUseMCP) {
    try {
      return await generateN8nWorkflowMCP(env, orchestrationPlan, job);
    } catch (error) {
      console.log("MCP generation failed, using legacy approach:", error.message);
    }
  }
  
  // Use legacy generation
  const legacyWorkflow = await generateLegacyWorkflow(env, orchestrationPlan, job);
  
  return {
    ...legacyWorkflow,
    meta: {
      ...legacyWorkflow.meta,
      mcpEnhanced: false,
      mcpAttempted: shouldUseMCP,
      generationMethod: 'legacy-primary'
    }
  };
}

function shouldAttemptMCP(orchestrationPlan, env) {
  // Only attempt MCP if we have the required configuration
  if (!env.N8N_MCP_SERVER_URL || !env.N8N_MCP_AUTH_TOKEN) {
    console.log("MCP configuration missing, skipping MCP generation");
    return false;
  }
  
  // Attempt MCP for complex workflows
  const stepCount = (orchestrationPlan.steps || []).length;
  const triggerCount = (orchestrationPlan.triggers || []).length;
  const complexity = stepCount + triggerCount;
  
  // Use MCP for workflows with multiple steps or AI requirements
  const hasAIRequirements = orchestrationPlan.description?.toLowerCase().includes('ai') ||
                           orchestrationPlan.description?.toLowerCase().includes('classify') ||
                           orchestrationPlan.description?.toLowerCase().includes('analyze');
  
  return complexity > 2 || hasAIRequirements;
}

export default generateN8nWorkflowMCP;