/**
 * Cloudflare Worker for Processing Automation Jobs
 * NOTE: Automation generation disabled - now provides recommendations only
 * Handles long-running automation analysis tasks
 */

import { processAutomationJob } from './processor';
import { validateN8nWorkflow } from './generators/n8n';
import { 
  validateOrganizationAccess, 
  checkOrganizationLimits,
  getJobOrganizationContext 
} from './database.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers - restrict origins in production
    const allowedOrigins = env.NODE_ENV === 'production' 
      ? ['https://process-audit-ai.vercel.app', env.NEXT_PUBLIC_APP_URL].filter(Boolean)
      : ['*'];
    
    const origin = request.headers.get('Origin');
    const allowOrigin = allowedOrigins.includes('*') || allowedOrigins.includes(origin) ? origin || '*' : 'null';
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get generated workflow endpoint
    if (url.pathname.startsWith('/workflow/')) {
      const jobId = url.pathname.split('/')[2];
      
      try {
        // For test jobs, generate the workflow synchronously and return it
        if (jobId && jobId.startsWith('test-')) {
          const fixture = {
            id: jobId,
            jobId: jobId,
            jobType: "n8n",
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
              }
            ]
          };
          
          // Import and run the processor
          const { processAutomationJob } = await import('./processor.js');
          const result = await processAutomationJob(env, fixture);
          
          return new Response(JSON.stringify({
            success: true,
            jobId: jobId,
            workflow: result.workflow_json,
            name: result.name,
            description: result.description
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error.message,
          stack: error.stack 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Test fixture endpoint for direct workflow generation testing
    if (url.pathname.startsWith('/test/')) {
      const fixtureName = url.pathname.split('/')[2] || 'email-support-test';
      
      try {
        // Load the fixture
        let fixture;
        if (fixtureName === 'email-support-test') {
          fixture = {
            "jobType": "n8n",
            "orchestrationPlan": {
              "description": "Customer support email handling process automation - categorize emails, research customer history, draft responses, and route for approval",
              "triggers": [
                {
                  "type": "email",
                  "source": "support@company.com",
                  "frequency": "immediate"
                }
              ],
              "steps": [
                {
                  "type": "email",
                  "action": "categorize",
                  "description": "Automatically categorize incoming emails as billing, technical, or general inquiry"
                },
                {
                  "type": "data_lookup",
                  "action": "customer_research",
                  "description": "Look up customer account history and previous interactions"
                },
                {
                  "type": "ai_processing",
                  "action": "draft_response",
                  "description": "Generate appropriate response based on category and customer history"
                },
                {
                  "type": "conditional",
                  "action": "approval_routing",
                  "description": "Route complex issues to manager for approval, send simple responses directly"
                },
                {
                  "type": "email",
                  "action": "send_response",
                  "description": "Send the final response to the customer"
                }
              ],
              "integrations": ["gmail", "crm", "knowledge_base"],
              "complexity": "medium",
              "estimatedTime": "15-30 minutes per email currently, target: 5 minutes",
              "volumeExpected": "200+ emails daily"
            },
            "requirements": {
              "compliance": ["GDPR"],
              "integrations": ["CRM system", "Email management platform", "Knowledge base"],
              "constraints": {
                "budget": "$50K for automation tools and implementation",
                "timeline": "3 months for busy season",
                "technical": "Must integrate with Gmail and CRM",
                "team": "Limited technical expertise, need user-friendly solutions"
              },
              "successMetrics": ["Response time reduction", "SLA compliance"],
              "priority": "Efficiency improvements for immediate ROI"
            },
            "testMetadata": {
              "testName": "Email Support Automation",
              "expectedNodes": ["Gmail Trigger", "OpenAI", "HTTP Request", "Switch", "Gmail"],
              "expectedConnections": 4,
              "shouldUseIntelligentPath": true,
              "description": "This fixture tests the intelligent email workflow generation with customer support automation"
            }
          };
        } else if (fixtureName === 'simple-http-test') {
          fixture = {
            "jobType": "n8n",
            "orchestrationPlan": {
              "description": "Simple HTTP API workflow - fetch data from external API and process it",
              "triggers": [
                {
                  "type": "webhook",
                  "source": "external",
                  "frequency": "on-demand"
                }
              ],
              "steps": [
                {
                  "type": "http",
                  "action": "fetch_data",
                  "description": "Fetch data from external REST API"
                },
                {
                  "type": "data_processing",
                  "action": "transform",
                  "description": "Transform and validate the received data"
                },
                {
                  "type": "storage",
                  "action": "save",
                  "description": "Save processed data to database"
                }
              ],
              "integrations": ["rest_api", "database"],
              "complexity": "simple",
              "estimatedTime": "2-5 minutes per execution",
              "volumeExpected": "50 requests daily"
            },
            "requirements": {
              "compliance": [],
              "integrations": [],
              "constraints": {
                "budget": "$10K",
                "timeline": "1 month",
                "technical": "Standard REST API integration",
                "team": "Basic technical knowledge"
              },
              "successMetrics": ["Execution speed", "Error rate reduction"],
              "priority": "Simple automation for testing"
            },
            "testMetadata": {
              "testName": "Simple HTTP Workflow",
              "expectedNodes": ["Webhook", "HTTP Request", "Set", "HTTP Request"],
              "expectedConnections": 3,
              "shouldUseIntelligentPath": false,
              "description": "This fixture tests basic blueprint-based workflow generation"
            }
          };
        } else if (fixtureName === 'email-sheets-airtable') {
          // Sophisticated email-sheets-airtable integration fixture
          fixture = {
            "jobType": "n8n",
            "processData": {
              "processDescription": "Customer inquiries arrive via email, need to be categorized, tracked in Google Sheets, stored in Airtable with enriched data, and responded to with personalized AI-generated responses",
              "businessContext": {
                "industry": "Customer Support",
                "department": "Operations", 
                "volume": "50-100 emails per day",
                "complexity": "High - requires email parsing, data extraction, multi-platform integration, and AI-powered responses"
              }
            },
            "automationOpportunities": [
              {
                "stepDescription": "AI-powered email classification and data extraction from customer inquiries",
                "automationSolution": "ai_email_processing",
                "priority": "high"
              },
              {
                "stepDescription": "Automated Google Sheets tracking and Airtable record creation with enriched customer data", 
                "automationSolution": "dual_platform_data_storage",
                "priority": "high"
              },
              {
                "stepDescription": "Intelligent response generation and automated email reply with personalization",
                "automationSolution": "ai_response_automation",
                "priority": "medium"
              },
              {
                "stepDescription": "Priority-based routing for high-urgency customer issues",
                "automationSolution": "conditional_routing",
                "priority": "medium"
              },
              {
                "stepDescription": "Real-time Slack notifications for support team coordination",
                "automationSolution": "team_notification",
                "priority": "low"
              }
            ],
            "testMetadata": {
              "testName": "Advanced Email-Sheets-Airtable Integration",
              "expectedNodes": ["Gmail Trigger", "OpenAI", "Function", "IF", "Google Sheets", "Airtable", "Gmail Send", "Slack"],
              "expectedConnections": 8,
              "shouldUseIntelligentPath": true,
              "expectedComplexity": "high",
              "description": "This fixture tests sophisticated multi-platform integration with AI-powered email processing, demonstrating real-world business automation capabilities"
            }
          };
        } else {
          throw new Error(`Unknown fixture: ${fixtureName}. Available: email-support-test, simple-http-test, email-sheets-airtable`);
        }

        // Generate a test job ID
        const jobId = `test-${fixtureName}-${Date.now()}`;
        
        // Add job to queue directly (bypassing normal queue flow for testing)
        const message = {
          jobId,
          timestamp: new Date().toISOString(),
          ...fixture
        };

        await env.AUTOMATION_QUEUE.send(message);
        
        return new Response(JSON.stringify({ 
          success: true,
          jobId,
          fixture: fixtureName,
          testMetadata: fixture.testMetadata,
          message: `Test job ${jobId} queued successfully. Check /status/${jobId} for results.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error.message,
          availableFixtures: ['email-support-test', 'simple-http-test', 'email-sheets-airtable']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get job status endpoint with organization context
    if (url.pathname.startsWith('/status/')) {
      const jobId = url.pathname.split('/')[2];
      const userId = url.searchParams.get('userId');
      const organizationId = url.searchParams.get('organizationId');
      
      try {
        // Get job organization context first
        const orgContext = await getJobOrganizationContext(env, jobId);
        
        // Validate access to job based on organization membership
        if (orgContext && orgContext.organizationId && userId) {
          const access = await validateOrganizationAccess(env, userId, orgContext.organizationId);
          if (!access) {
            return new Response(JSON.stringify({ 
              error: 'Access denied',
              details: 'You do not have access to this automation job',
              code: 'JOB_ACCESS_DENIED'
            }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        const status = await getJobStatus(env, jobId);
        
        // Enhance status with organization context
        const enhancedStatus = {
          ...status,
          organizationContext: orgContext ? {
            organizationId: orgContext.organizationId,
            organizationName: orgContext.organization?.name || 'Unknown',
            organizationPlan: orgContext.organization?.plan || 'free'
          } : null
        };
        
        return new Response(JSON.stringify(enhancedStatus), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error(`Job status error for ${jobId}:`, error.message);
        return new Response(JSON.stringify({ 
          error: 'Failed to get job status',
          details: error.message,
          code: 'JOB_STATUS_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Submit job endpoint with organization context validation
    if (url.pathname === '/submit' && request.method === 'POST') {
      try {
        const job = await request.json();
        const jobId = job.jobId || job.id;
        
        // Extract organization context from job data
        const userId = job.userId;
        const organizationId = job.organizationId;
        
        console.log(`Processing job submission: ${jobId} for user: ${userId}, organization: ${organizationId || 'Personal'}`);
        
        // Validate organization access if organizationId is provided
        if (organizationId && userId) {
          try {
            const access = await validateOrganizationAccess(env, userId, organizationId);
            if (!access) {
              console.error(`Access denied: User ${userId} is not a member of organization ${organizationId}`);
              return new Response(JSON.stringify({ 
                error: 'Organization access denied',
                details: `User does not have access to organization ${organizationId}`,
                code: 'ORGANIZATION_ACCESS_DENIED'
              }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            console.log(`Access granted: User ${userId} has ${access.role} role in organization ${organizationId}`);
          } catch (accessError) {
            console.error(`Organization access validation failed:`, accessError.message);
            return new Response(JSON.stringify({ 
              error: 'Organization validation failed',
              details: accessError.message,
              code: 'ORGANIZATION_VALIDATION_ERROR'
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        // Check organization plan limits
        if (organizationId) {
          const limitsCheck = await checkOrganizationLimits(env, organizationId);
          if (!limitsCheck.allowed) {
            console.warn(`Automation limit exceeded for organization ${organizationId}: ${limitsCheck.reason}`);
            return new Response(JSON.stringify({ 
              error: 'Plan limit exceeded',
              details: `Your ${limitsCheck.plan} plan allows ${limitsCheck.limit} automations per month. You have used ${limitsCheck.currentUsage}.`,
              code: 'PLAN_LIMIT_EXCEEDED',
              limits: limitsCheck
            }), {
              status: 429, // Too Many Requests
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          console.log(`Plan limits check passed: ${limitsCheck.currentUsage}/${limitsCheck.limit} automations used`);
        }
        
        // Enhance job with organization context for queue processing
        const enhancedJob = {
          ...job,
          organizationContext: {
            organizationId,
            userId,
            submittedAt: new Date().toISOString()
          }
        };
        
        // Add job to queue
        await env.AUTOMATION_QUEUE.send(enhancedJob);
        
        // Return job ID for status polling
        return new Response(JSON.stringify({ 
          jobId: jobId,
          status: 'queued',
          organizationId: organizationId || null,
          message: `Job queued successfully for ${organizationId ? 'organization' : 'personal'} workspace`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Job submission error:', error.message);
        return new Response(JSON.stringify({ 
          error: 'Job submission failed',
          details: error.message,
          code: 'JOB_SUBMISSION_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate n8n workflow JSON
    if (url.pathname === '/validate' && request.method === 'POST') {
      try {
        const body = await request.json();
        const workflow = body?.workflow || body;
        const result = validateN8nWorkflow(workflow);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ valid: false, errors: [error.message] }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Cost monitoring endpoint
    if (url.pathname === '/cost-summary' && request.method === 'GET') {
      try {
        const { CostMonitor } = await import('./monitoring/cost-monitor.js');
        const costMonitor = new CostMonitor(env);
        
        const summary = costMonitor.getCostSummary();
        const recommendations = costMonitor.getOptimizationRecommendations({});
        
        return new Response(JSON.stringify({
          summary,
          recommendations,
          timestamp: new Date().toISOString()
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Test MCP connection endpoint
    if (url.pathname === '/test-mcp' && request.method === 'GET') {
      try {
        const { N8nMCPClient } = await import('./mcp/n8n-client.js');
        const mcpClient = new N8nMCPClient(env);
        
        const testResult = {
          serverUrl: mcpClient.serverUrl,
          hasAuthToken: !!env.N8N_MCP_AUTH_TOKEN,
          timestamp: new Date().toISOString()
        };
        
        // Try to connect if auth token is available
        if (env.N8N_MCP_AUTH_TOKEN) {
          try {
            await mcpClient.connect();
            testResult.connectionStatus = 'success';
            testResult.sessionId = mcpClient.sessionId;
            await mcpClient.disconnect();
          } catch (connectionError) {
            testResult.connectionStatus = 'failed';
            testResult.connectionError = connectionError.message;
          }
        } else {
          testResult.connectionStatus = 'no_auth_token';
        }
        
        return new Response(JSON.stringify(testResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error.message, 
          stack: error.stack 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },

  // Queue consumer for processing automation jobs with organization context
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const job = message.body;
        const jobId = job.jobId || job.id || 'undefined';
        const orgContext = job.organizationContext || {};
        
        console.log(`Processing job: ${jobId} for organization: ${orgContext.organizationId || 'Personal'}`);
        
        // Process the automation job with organization context
        await processAutomationJob(env, job);
        
        // Acknowledge message
        message.ack();
        console.log(`Successfully processed job: ${jobId}`);
      } catch (error) {
        console.error(`Error processing job: ${error.message}`);
        console.error(`Job details:`, JSON.stringify(message.body, null, 2));
        
        // For organization limit errors, don't retry
        if (error.message.includes('PLAN_LIMIT_EXCEEDED') || 
            error.message.includes('ORGANIZATION_ACCESS_DENIED')) {
          console.log('Not retrying job due to access/limit restrictions');
          message.ack(); // Acknowledge to prevent retry loop
        } else {
          // Retry the message for other errors
          message.retry();
        }
      }
    }
  }
};

async function getJobStatus(env, jobId) {
  // Check if Supabase is configured
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    // For test jobs without database, return a mock status
    if (jobId.startsWith('test-')) {
      return {
        id: jobId,
        status: 'completed',
        message: 'Test job completed - workflow generated but database not configured',
        progress: 100
      };
    }
    throw new Error('Database not configured');
  }

  try {
    // Fetch job with organization context
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/automation_jobs?id=eq.${jobId}&select=*,organizations(id,name,slug,plan)`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch job status (${response.status}): ${errorText}`);
      throw new Error('Failed to fetch job status');
    }

    const jobs = await response.json();
    if (jobs.length === 0) {
      // For test jobs, return a mock status
      if (jobId.startsWith('test-')) {
        return {
          id: jobId,
          status: 'completed',
          message: 'Test job completed',
          progress: 100
        };
      }
      throw new Error('Job not found');
    }

    const job = jobs[0];
    
    // Enhanced job status with organization context
    return {
      ...job,
      organization: job.organizations || null,
      workspace: job.organization_id ? 'organization' : 'personal'
    };
  } catch (error) {
    console.error(`Error fetching job status for ${jobId}:`, error.message);
    throw error;
  }
}