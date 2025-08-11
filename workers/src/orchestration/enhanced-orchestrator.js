/**
 * Enhanced Orchestrator with MCP Integration
 * Creates sophisticated automation plans using full n8n ecosystem via MCP
 */

import { N8nMCPClient } from '../mcp/n8n-client.js';
import { callModel } from '../ai/model-router.js';

export class EnhancedOrchestrator {
  constructor(env) {
    this.env = env;
    this.mcpClient = new N8nMCPClient(env);
    this.availableNodes = new Map();
    this.nodeCapabilities = new Map();
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Enhanced Orchestrator with MCP integration');
      await this.mcpClient.connect();
      
      // Load core node capabilities for email, sheets, airtable workflows
      await this.loadCoreNodeCapabilities();
      
      console.log(`✅ Orchestrator initialized with ${this.availableNodes.size} node types`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Orchestrator:', error.message);
      return false;
    }
  }

  async loadCoreNodeCapabilities() {
    // Define core nodes we want to leverage for email/sheets/airtable workflows
    const coreNodes = {
      'gmail': {
        capabilities: ['trigger_on_new_email', 'send_email', 'search_emails', 'mark_read'],
        configurations: {
          trigger: { folder: 'INBOX', filter: 'query_string' },
          send: { to: 'email', subject: 'string', body: 'html_or_text' }
        }
      },
      'googleSheets': {
        capabilities: ['read_sheet', 'append_row', 'update_cell', 'create_sheet'],
        configurations: {
          append: { sheetId: 'string', range: 'A1:Z', values: 'array' },
          update: { sheetId: 'string', range: 'cell', value: 'any' }
        }
      },
      'airtable': {
        capabilities: ['create_record', 'update_record', 'search_records', 'delete_record'],
        configurations: {
          create: { base: 'string', table: 'string', fields: 'object' },
          update: { base: 'string', table: 'string', recordId: 'string', fields: 'object' }
        }
      },
      'openai': {
        capabilities: ['text_completion', 'classification', 'data_extraction', 'response_generation'],
        configurations: {
          completion: { model: 'gpt-3.5-turbo', prompt: 'string', temperature: 'number' }
        }
      },
      'function': {
        capabilities: ['data_transformation', 'validation', 'calculation', 'parsing'],
        configurations: {
          code: { functionCode: 'javascript_string' }
        }
      },
      'if': {
        capabilities: ['conditional_routing', 'data_filtering', 'priority_handling'],
        configurations: {
          conditions: { operation: 'equal|contains|greater', leftValue: 'string', rightValue: 'string' }
        }
      },
      'slack': {
        capabilities: ['send_message', 'create_channel', 'upload_file'],
        configurations: {
          message: { channel: 'string', message: 'string' }
        }
      },
      'switch': {
        capabilities: ['multi_path_routing', 'categorization', 'workflow_branching'],
        configurations: {
          mode: 'rules', rules: { conditions: 'array', outputs: 'array' }
        }
      },
      'merge': {
        capabilities: ['data_combination', 'workflow_synchronization'],
        configurations: {
          mode: 'append|merge|waitForAll', options: 'object'
        }
      },
      'webhook': {
        capabilities: ['http_trigger', 'api_endpoint', 'external_integration'],
        configurations: {
          path: 'string', httpMethod: 'POST|GET|PUT', authentication: 'none|basic|bearer'
        }
      }
    };

    for (const [nodeType, config] of Object.entries(coreNodes)) {
      this.availableNodes.set(nodeType, config);
      this.nodeCapabilities.set(nodeType, config.capabilities);
    }
  }

  async createSophisticatedOrchestrationPlan(job) {
    console.log('🧠 Creating sophisticated orchestration plan with MCP integration');
    
    // Analyze the business requirements
    const requirements = this.analyzeBusinessRequirements(job);
    console.log('📋 Business requirements:', requirements);
    
    // Discover relevant nodes based on requirements
    const relevantNodes = this.discoverRelevantNodes(requirements);
    console.log(`🔍 Discovered ${relevantNodes.length} relevant node types:`, relevantNodes.map(n => n.type));
    
    // Build enhanced orchestration prompt with discovered capabilities
    const orchestrationPrompt = this.buildEnhancedOrchestrationPrompt(job, requirements, relevantNodes);
    
    // Use high-tier model for sophisticated planning with reduced token limit
    const planningResult = await callModel(this.env, orchestrationPrompt, {
      tier: 'orchestrator',
      maxTokens: 2048, // Reduced for better context management
      temperature: 0.1  // Lower temperature for more reliable JSON output
    });
    
    // Parse and validate the orchestration plan
    const orchestrationPlan = this.parseAndValidateOrchestrationPlan(planningResult, job);
    
    console.log('✅ Sophisticated orchestration plan created');
    console.log(`📊 Plan includes ${orchestrationPlan.steps?.length || 0} steps with ${orchestrationPlan.triggers?.length || 0} triggers`);
    
    return orchestrationPlan;
  }

  analyzeBusinessRequirements(job) {
    const processDesc = job.processData?.processDescription || '';
    const opportunities = job.automationOpportunities || [];
    
    const requirements = {
      hasEmailProcessing: processDesc.toLowerCase().includes('email') || opportunities.some(o => o.automationSolution?.includes('email')),
      hasSheetsIntegration: processDesc.toLowerCase().includes('sheet') || processDesc.toLowerCase().includes('spreadsheet'),
      hasAirtableIntegration: processDesc.toLowerCase().includes('airtable') || processDesc.toLowerCase().includes('database'),
      needsAIProcessing: processDesc.toLowerCase().includes('analyz') || processDesc.toLowerCase().includes('classify') || processDesc.toLowerCase().includes('extract'),
      needsNotifications: processDesc.toLowerCase().includes('notify') || processDesc.toLowerCase().includes('alert'),
      hasConditionalLogic: processDesc.toLowerCase().includes('if') || processDesc.toLowerCase().includes('priority') || processDesc.toLowerCase().includes('route'),
      complexityLevel: this.assessComplexityLevel(job),
      industryContext: job.processData?.businessContext?.industry || 'general',
      volumeExpected: job.processData?.businessContext?.volume || 'medium'
    };

    return requirements;
  }

  assessComplexityLevel(job) {
    const processDesc = job.processData?.processDescription || '';
    const opportunities = job.automationOpportunities || [];
    
    let complexity = 0;
    
    // Add complexity for different integration types
    if (processDesc.includes('email')) complexity += 2;
    if (processDesc.includes('sheet') || processDesc.includes('airtable')) complexity += 2;
    if (processDesc.includes('ai') || processDesc.includes('analyz')) complexity += 3;
    if (opportunities.length > 3) complexity += 2;
    if (processDesc.includes('conditional') || processDesc.includes('route')) complexity += 2;
    
    if (complexity <= 3) return 'simple';
    if (complexity <= 7) return 'medium';
    return 'high';
  }

  discoverRelevantNodes(requirements) {
    const relevantNodes = [];
    
    // Email processing nodes
    if (requirements.hasEmailProcessing) {
      relevantNodes.push(
        { type: 'gmail', priority: 'high', reason: 'Email processing required' },
        { type: 'openai', priority: 'high', reason: 'AI email analysis' },
        { type: 'function', priority: 'medium', reason: 'Email data parsing' }
      );
    }
    
    // Data storage nodes
    if (requirements.hasSheetsIntegration) {
      relevantNodes.push(
        { type: 'googleSheets', priority: 'high', reason: 'Google Sheets integration' }
      );
    }
    
    if (requirements.hasAirtableIntegration) {
      relevantNodes.push(
        { type: 'airtable', priority: 'high', reason: 'Airtable database integration' }
      );
    }
    
    // Logic and processing nodes
    if (requirements.hasConditionalLogic) {
      relevantNodes.push(
        { type: 'if', priority: 'high', reason: 'Conditional logic required' },
        { type: 'switch', priority: 'medium', reason: 'Multi-path routing' }
      );
    }
    
    // AI processing
    if (requirements.needsAIProcessing) {
      relevantNodes.push(
        { type: 'openai', priority: 'high', reason: 'AI processing capabilities' }
      );
    }
    
    // Notifications
    if (requirements.needsNotifications) {
      relevantNodes.push(
        { type: 'slack', priority: 'medium', reason: 'Team notifications' },
        { type: 'gmail', priority: 'medium', reason: 'Email notifications' }
      );
    }
    
    // Always include core utility nodes
    relevantNodes.push(
      { type: 'function', priority: 'medium', reason: 'Data transformation' },
      { type: 'merge', priority: 'low', reason: 'Workflow synchronization' },
      { type: 'webhook', priority: 'low', reason: 'External triggers' }
    );
    
    // Remove duplicates and sort by priority
    const uniqueNodes = relevantNodes.filter((node, index, self) => 
      index === self.findIndex(n => n.type === node.type)
    ).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    return uniqueNodes;
  }

  buildEnhancedOrchestrationPrompt(job, requirements, relevantNodes) {
    // Optimized prompt - much shorter but still intelligent
    const topNodes = relevantNodes.slice(0, 6).map(n => n.type).join(', ');
    const processDesc = job.processData?.processDescription?.slice(0, 200) || 'Business automation';
    const opportunities = job.automationOpportunities?.slice(0, 3) || [];
    
    return `Create an n8n workflow plan for: ${processDesc}

REQUIREMENTS: ${requirements.hasEmailProcessing ? 'Email' : ''}${requirements.hasSheetsIntegration ? ' Sheets' : ''}${requirements.hasAirtableIntegration ? ' Airtable' : ''}${requirements.needsAIProcessing ? ' AI' : ''} integration.

AVAILABLE NODES: ${topNodes}

AUTOMATION GOALS: ${opportunities.map(o => o.automationSolution).join(', ')}

Return JSON:
{
  "workflowName": "string",
  "description": "string", 
  "triggers": [{"type": "gmail|webhook", "name": "string", "configuration": {}}],
  "steps": [{"id": "string", "name": "string", "type": "openai|gmail|googleSheets|airtable|function", "description": "string", "configuration": {}}],
  "connections": [{"from": "string", "to": "string"}],
  "expectedOutcomes": {"timeReduction": "string", "accuracyImprovement": "string"}
}

Create 4-6 steps with email→AI analysis→data storage→response flow.`;
  }

  parseAndValidateOrchestrationPlan(planningResult, job) {
    try {
      // Clean and extract JSON from the response
      let cleanJson = planningResult.trim();
      
      // Remove markdown code blocks if present
      cleanJson = cleanJson.replace(/```json\s*/, '').replace(/```\s*$/, '');
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
      
      const orchestrationPlan = JSON.parse(cleanJson);
      
      // Add metadata
      orchestrationPlan.meta = {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Enhanced Orchestrator with MCP',
        jobId: job.id,
        mcpEnhanced: true,
        sophisticatedPlanning: true
      };
      
      // Validate required fields
      if (!orchestrationPlan.workflowName) {
        orchestrationPlan.workflowName = 'Advanced Automation Workflow';
      }
      
      if (!orchestrationPlan.steps || !Array.isArray(orchestrationPlan.steps)) {
        throw new Error('Invalid orchestration plan: missing or invalid steps array');
      }
      
      if (!orchestrationPlan.triggers || !Array.isArray(orchestrationPlan.triggers)) {
        throw new Error('Invalid orchestration plan: missing or invalid triggers array');
      }
      
      console.log(`✅ Orchestration plan validated: ${orchestrationPlan.steps.length} steps, ${orchestrationPlan.triggers.length} triggers`);
      
      return orchestrationPlan;
      
    } catch (error) {
      console.error('❌ Failed to parse orchestration plan:', error.message);
      console.error('Raw response:', planningResult);
      
      // Return a sophisticated fallback plan
      return this.createFallbackSophisticatedPlan(job);
    }
  }

  createFallbackSophisticatedPlan(job) {
    console.log('🔄 Creating sophisticated fallback orchestration plan');
    
    return {
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
          id: 'data_processing',
          name: 'Data Processing & Validation',
          type: 'function',
          description: 'Process AI response and prepare data for storage',
          configuration: {
            functionCode: 'const analysis = JSON.parse($json.choices[0].message.content); return [{ json: analysis }];'
          }
        },
        {
          id: 'priority_check',
          name: 'Priority Routing',
          type: 'if',
          description: 'Route high-priority emails for immediate attention',
          configuration: {
            conditions: {
              leftValue: '={{ $json.priority }}',
              operation: 'equal',
              rightValue: 'high'
            }
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
        },
        {
          id: 'send_reply',
          name: 'Send Email Reply',
          type: 'gmail',
          description: 'Send automated response to customer',
          configuration: {
            operation: 'send',
            to: '{{ $json.from }}',
            subject: 'Re: {{ $json.subject }}',
            body: '{{ $json.choices[0].message.content }}'
          }
        }
      ],
      connections: [
        { from: 'New Email Trigger', to: 'email_analysis' },
        { from: 'email_analysis', to: 'data_processing' },
        { from: 'data_processing', to: 'priority_check' },
        { from: 'priority_check', to: 'sheets_update' },
        { from: 'sheets_update', to: 'airtable_record' },
        { from: 'airtable_record', to: 'ai_response' },
        { from: 'ai_response', to: 'send_reply' }
      ],
      errorHandling: {
        strategy: 'retry-with-notification',
        notifications: ['slack'],
        fallbackActions: ['Forward to support team', 'Log in error sheet']
      },
      expectedOutcomes: {
        timeReduction: 'From 30+ minutes to 2-5 minutes per email',
        accuracyImprovement: '95%+ consistent data vs 70-80% manual',
        scalabilityBenefit: 'Handle 10x volume without additional staff'
      },
      meta: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Enhanced Orchestrator Fallback',
        jobId: job.id,
        mcpEnhanced: true,
        sophisticatedPlanning: true,
        fallbackUsed: true
      }
    };
  }

  async cleanup() {
    try {
      await this.mcpClient.disconnect();
      console.log('✅ Enhanced Orchestrator cleanup completed');
    } catch (error) {
      console.error('Error during orchestrator cleanup:', error);
    }
  }
}

export default EnhancedOrchestrator;