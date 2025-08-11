/**
 * n8n MCP Client
 * Handles communication with the n8n MCP server for workflow management
 */

// Note: This is a placeholder implementation since @anthropic-ai/agents is not yet publicly available
// In the future, this would import: import { MCPClientManager } from "@anthropic-ai/agents";

export class N8nMCPClient {
  constructor(env) {
    this.env = env;
    this.isConnected = false;
    this.serverUrl = env.N8N_MCP_SERVER_URL || "https://czlonkowskin8n-mcp-railwaylatest-production-a820.up.railway.app";
    this.sessionId = null;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      // Initialize MCP connection using JSON-RPC 2.0 protocol
      const response = await fetch(`${this.serverUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.env.N8N_MCP_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              resources: {},
              tools: {}
            },
            clientInfo: {
              name: 'process-audit-ai',
              version: '1.0.0'
            }
          },
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(`MCP initialization failed: ${result.error.message}`);
      }
      
      this.sessionId = result.id;
      this.isConnected = true;
      
      console.log(`✅ Connected to n8n MCP server at ${this.serverUrl}`, result.result);
    } catch (error) {
      console.error(`❌ Failed to connect to n8n MCP server:`, error);
      throw new Error(`MCP connection failed: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.isConnected && this.sessionId) {
      try {
        await fetch(`${this.serverUrl}/session/${this.sessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.env.N8N_MCP_AUTH_TOKEN}`
          }
        });
      } catch (error) {
        console.error("Error disconnecting from MCP server:", error);
      }
      
      this.isConnected = false;
      this.sessionId = null;
      console.log("🔌 Disconnected from n8n MCP server");
    }
  }

  async ensureConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  async callTool(toolName, parameters = {}) {
    await this.ensureConnection();
    
    try {
      const requestId = Math.floor(Math.random() * 1000000);
      const response = await fetch(`${this.serverUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.env.N8N_MCP_AUTH_TOKEN}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: parameters
          },
          id: requestId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(`MCP tool error: ${result.error.message}`);
      }

      return result.result;
    } catch (error) {
      console.error(`Error calling tool ${toolName}:`, error);
      throw new Error(`Tool call failed: ${error.message}`);
    }
  }

  // Enhanced MCP Tools for n8n workflow generation
  
  // Get essential properties for quick node configuration (10-20 properties instead of 200+)
  async getNodeEssentials(nodeType) {
    return await this.callTool('get_node_essentials', { nodeType });
  }
  
  // Search nodes by functionality or name
  async searchNodes(query, options = {}) {
    return await this.callTool('search_nodes', { query, ...options });
  }
  
  // Get pre-configured settings for common tasks
  async getNodeForTask(taskName) {
    return await this.callTool('get_node_for_task', { task: taskName });
  }
  
  // Validate node configuration before deployment
  async validateNodeOperation(nodeType, config, profile = 'runtime') {
    return await this.callTool('validate_node_operation', { 
      nodeType, 
      config, 
      profile 
    });
  }
  
  // Quick validation for required fields only
  async validateNodeMinimal(nodeType, config) {
    return await this.callTool('validate_node_minimal', { 
      nodeType, 
      config 
    });
  }
  
  // List available AI-capable nodes
  async listAITools() {
    return await this.callTool('list_ai_tools');
  }
  
  // Validate complete workflow including connections
  async validateWorkflow(workflow) {
    return await this.callTool('validate_workflow', { workflow });
  }
  
  // List available task templates
  async listTasks() {
    return await this.callTool('list_tasks');
  }

  // Node Discovery & Documentation
  async getNodeDetails(functionality) {
    try {
      const result = await this.callTool("search_nodes", {
        functionality
      });
      
      return result?.nodes || [];
    } catch (error) {
      console.error(`Error searching nodes for "${functionality}":`, error);
      throw new Error(`Node search failed: ${error.message}`);
    }
  }


  // Workflow Management
  async createWorkflow(workflowData) {
    try {
      const result = await this.callTool("n8n_create_workflow", {
        workflow: workflowData
      });
      
      return result;
    } catch (error) {
      console.error("Error creating n8n workflow:", error);
      throw new Error(`Workflow creation failed: ${error.message}`);
    }
  }

  async updateWorkflow(workflowId, diff) {
    try {
      const result = await this.callTool("n8n_update_partial_workflow", {
        workflow_id: workflowId,
        diff
      });
      
      return result;
    } catch (error) {
      console.error(`Error updating workflow ${workflowId}:`, error);
      throw new Error(`Workflow update failed: ${error.message}`);
    }
  }

  async triggerWebhookWorkflow(webhookUrl, data) {
    try {
      const result = await this.callTool("n8n_trigger_webhook_workflow", {
        webhook_url: webhookUrl,
        data
      });
      
      return result;
    } catch (error) {
      console.error(`Error triggering webhook workflow:`, error);
      throw new Error(`Webhook trigger failed: ${error.message}`);
    }
  }

  // Enhanced workflow building with AI capabilities
  async buildIntelligentWorkflow(requirements) {
    
    try {
      // Step 1: Search for relevant nodes
      const relevantNodes = await this.searchNodes(requirements.functionality);
      console.log(`🔍 Found ${relevantNodes.length} relevant nodes`);

      // Step 2: Get AI-capable nodes if needed
      const aiNodes = requirements.useAI ? await this.listAITools() : [];
      console.log(`🤖 Found ${aiNodes.length} AI-capable nodes`);

      // Step 3: Get pre-configured nodes for specific tasks
      const taskNodes = await Promise.all(
        requirements.tasks.map(task => this.getNodeForTask(task))
      );
      console.log(`⚙️ Got configurations for ${taskNodes.length} task-specific nodes`);

      // Step 4: Validate all node configurations
      const validatedNodes = await Promise.all(
        taskNodes.map(async (node) => {
          if (node.type && node.parameters) {
            const validation = await this.validateNodeOperation(node.type, node.parameters);
            return { ...node, validation };
          }
          return node;
        })
      );

      // Step 5: Build workflow structure
      const workflow = this.assembleIntelligentWorkflow({
        relevantNodes,
        aiNodes,
        taskNodes: validatedNodes,
        requirements
      });

      // Step 6: Validate complete workflow
      const workflowValidation = await this.validateWorkflow(workflow);
      if (!workflowValidation.valid) {
        throw new Error(`Workflow validation failed: ${workflowValidation.errors?.join(', ')}`);
      }

      console.log("✅ Intelligent workflow built and validated successfully");
      return { workflow, validation: workflowValidation };

    } catch (error) {
      console.error("Error building intelligent workflow:", error);
      throw new Error(`Intelligent workflow building failed: ${error.message}`);
    }
  }

  // Private helper method to assemble workflow from components
  assembleIntelligentWorkflow({ relevantNodes, aiNodes, taskNodes, requirements }) {
    const workflow = {
      name: requirements.name || "AI-Generated Workflow",
      nodes: [],
      connections: {},
      settings: {
        executionOrder: "v1"
      },
      active: false,
      tags: ["ai-generated", "mcp-enhanced"],
      meta: {
        generatedBy: "n8n MCP Client",
        generatedAt: new Date().toISOString(),
        capabilities: {
          hasAINodes: aiNodes.length > 0,
          nodeCount: taskNodes.length,
          validatedNodes: taskNodes.filter(n => n.validation?.valid).length
        }
      }
    };

    let nodePosition = [250, 250];
    const nodeSpacing = 200;

    // Add validated task nodes
    taskNodes.forEach((taskNode, index) => {
      if (taskNode.type && taskNode.validation?.valid) {
        workflow.nodes.push({
          id: `node-${index}`,
          name: taskNode.name || `Task Node ${index + 1}`,
          type: taskNode.type,
          position: [nodePosition[0], nodePosition[1] + (index * nodeSpacing)],
          parameters: taskNode.parameters || {},
          typeVersion: taskNode.typeVersion || 1
        });
      }
    });

    // Create simple linear connections for now
    // TODO: Implement more sophisticated connection logic
    for (let i = 0; i < workflow.nodes.length - 1; i++) {
      const currentNode = workflow.nodes[i];
      const nextNode = workflow.nodes[i + 1];
      
      workflow.connections[currentNode.name] = {
        main: [[{
          node: nextNode.name,
          type: "main",
          index: 0
        }]]
      };
    }

    return workflow;
  }

  // Utility method for handling MCP errors gracefully
  async withErrorHandling(operation, fallback = null) {
    try {
      return await operation();
    } catch (error) {
      console.error(`MCP operation failed:`, error);
      
      if (fallback) {
        console.log("🔄 Using fallback method");
        return await fallback();
      }
      
      throw error;
    }
  }
}

export default N8nMCPClient;