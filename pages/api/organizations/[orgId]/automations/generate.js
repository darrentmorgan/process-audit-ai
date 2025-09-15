/**
 * Backend Automation Generation API
 * Replaces Cloudflare Workers with Next.js backend automation generation
 *
 * Generates automation workflows with industry-specific context and multi-tenant security
 */

import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { validateOrganizationContext } from '../../../../../utils/security/organization-context-validator';
import { logAuditEvent, AUDIT_EVENTS } from '../../../../../utils/security/audit-logger';
import { logger } from '../../../../../utils/logger';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { orgId } = req.query;

  logger.info('Backend automation generation request started', {
    correlationId,
    organizationId: orgId,
    method: req.method,
    path: req.url
  });

  try {
    // Validate organization context using Sprint 1 security framework
    const orgValidation = await validateOrganizationContext(req, res);

    if (!orgValidation.valid) {
      return res.status(orgValidation.statusCode || 403).json({
        success: false,
        error: orgValidation.error,
        correlationId
      });
    }

    // Ensure requested organization matches user's organization
    if (orgId !== orgValidation.organizationId) {
      logAuditEvent(AUDIT_EVENTS.CROSS_TENANT_ATTEMPT, {
        correlationId,
        userId: orgValidation.userId,
        sourceOrgId: orgValidation.organizationId,
        targetOrgId: orgId,
        blocked: true,
        resource: 'automation_generation'
      });

      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Organization context mismatch',
        correlationId
      });
    }

    const {
      auditReportId,
      processData,
      automationOpportunities,
      automationType = 'n8n',
      preferences = {}
    } = req.body;

    if (!processData || !automationOpportunities) {
      return res.status(400).json({
        success: false,
        error: 'Process data and automation opportunities required',
        correlationId
      });
    }

    // Get organization details for industry-specific automation
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError || !organization) {
      logger.error('Organization lookup failed for automation', orgError, {
        correlationId,
        organizationId: orgId
      });

      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        correlationId
      });
    }

    // Create automation job record
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: job, error: jobError } = await supabase
      .from('automation_jobs')
      .insert({
        id: jobId,
        user_id: orgValidation.userId,
        audit_report_id: auditReportId,
        organization_id: orgId,
        status: 'processing',
        progress: 0,
        automation_type: automationType,
        workflow_data: {
          processData,
          automationOpportunities,
          preferences,
          organizationContext: {
            industry_type: organization.industry_type,
            plan: organization.plan
          }
        }
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create automation job: ${jobError.message}`);
    }

    // Generate automations using backend AI integration
    const automationResults = await generateAutomations({
      processData,
      automationOpportunities,
      automationType,
      organization,
      correlationId
    });

    // Save generated automations
    const automations = [];
    for (const automation of automationResults) {
      const { data: automationRecord, error: autoError } = await supabase
        .from('generated_automations')
        .insert({
          job_id: jobId,
          organization_id: orgId,
          name: automation.name,
          description: automation.description,
          platform: automationType,
          workflow_json: automation.workflow,
          instructions: automation.instructions
        })
        .select()
        .single();

      if (autoError) {
        logger.error('Failed to save automation', autoError, {
          correlationId,
          jobId,
          automationName: automation.name
        });
      } else {
        automations.push(automationRecord);
      }
    }

    // Update job status to completed
    await supabase
      .from('automation_jobs')
      .update({
        status: 'completed',
        progress: 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Log successful automation generation for audit
    logAuditEvent(AUDIT_EVENTS.AUTOMATION_CREATED, {
      correlationId,
      userId: orgValidation.userId,
      organizationId: orgId,
      resource: 'automation_generation',
      jobId,
      automationType,
      automationCount: automations.length,
      industryType: organization.industry_type
    });

    const processingTime = Date.now() - startTime;

    logger.info('Backend automation generation completed', {
      correlationId,
      organizationId: orgId,
      jobId,
      automationType,
      automationCount: automations.length,
      processingTime,
      industryType: organization.industry_type
    });

    return res.status(200).json({
      success: true,
      data: {
        jobId,
        automations,
        organizationId: orgId,
        automationType,
        processingTime,
        status: 'completed'
      },
      correlationId
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('Backend automation generation failed', error, {
      correlationId,
      organizationId: orgId,
      processingTime,
      errorMessage: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Automation generation failed',
      correlationId,
      processingTime
    });
  }
}

/**
 * Generate automations using backend AI integration
 */
async function generateAutomations({ processData, automationOpportunities, automationType, organization, correlationId }) {
  const industryType = organization?.industry_type || 'general';

  logger.info('Generating backend automations', {
    correlationId,
    organizationId: organization.id,
    industryType,
    automationType,
    opportunitiesCount: automationOpportunities.length
  });

  // Industry-specific automation templates
  const industryTemplates = {
    hospitality: {
      platforms: ['n8n', 'zapier', 'make'],
      commonAutomations: [
        'Guest check-in notification workflows',
        'Housekeeping task automation',
        'Maintenance request processing',
        'Guest feedback collection',
        'Property management integrations'
      ]
    },
    restaurant: {
      platforms: ['n8n', 'zapier', 'make'],
      commonAutomations: [
        'Food safety compliance automation',
        'Kitchen order management',
        'Inventory tracking workflows',
        'Staff scheduling automation',
        'Customer feedback processing'
      ]
    },
    medical: {
      platforms: ['n8n', 'zapier'],
      commonAutomations: [
        'Patient care workflow automation',
        'Compliance documentation workflows',
        'Medical record processing',
        'Appointment scheduling automation',
        'Clinical alert systems'
      ]
    },
    general: {
      platforms: ['n8n', 'zapier', 'make'],
      commonAutomations: [
        'Process optimization workflows',
        'Quality control automation',
        'Document management',
        'Compliance tracking',
        'Performance monitoring'
      ]
    }
  };

  const template = industryTemplates[industryType] || industryTemplates.general;

  // Generate automations based on opportunities
  const generatedAutomations = [];

  for (const opportunity of automationOpportunities.slice(0, 3)) { // Limit to top 3
    const automation = {
      name: `${opportunity.stepDescription} Automation`,
      description: `Automated workflow for ${opportunity.stepDescription.toLowerCase()} using ${automationType}`,
      platform: automationType,
      workflow: generateWorkflowJSON(opportunity, automationType, industryType),
      instructions: generateImplementationInstructions(opportunity, automationType, industryType),
      estimatedSavings: opportunity.annualSavings || '$5,000',
      feasibility: opportunity.feasibility || 'High',
      priority: opportunity.priority || 80
    };

    generatedAutomations.push(automation);

    logger.info('Generated automation', {
      correlationId,
      organizationId: organization.id,
      automationName: automation.name,
      platform: automationType,
      priority: automation.priority
    });
  }

  return generatedAutomations;
}

/**
 * Generate workflow JSON for automation platforms
 */
function generateWorkflowJSON(opportunity, platform, industryType) {
  const baseWorkflow = {
    name: opportunity.stepDescription,
    description: opportunity.automationSolution,
    platform,
    industryType,
    nodes: [
      {
        id: 'trigger',
        type: 'trigger',
        name: 'Process Trigger',
        configuration: {
          triggerType: 'schedule',
          frequency: opportunity.frequency || 'daily'
        }
      },
      {
        id: 'process',
        type: 'processing',
        name: 'Process Automation',
        configuration: {
          action: opportunity.automationSolution,
          tools: opportunity.tools || ['API', 'Database']
        }
      },
      {
        id: 'output',
        type: 'output',
        name: 'Result Processing',
        configuration: {
          outputType: 'notification',
          destination: 'dashboard'
        }
      }
    ],
    connections: [
      { from: 'trigger', to: 'process' },
      { from: 'process', to: 'output' }
    ]
  };

  return baseWorkflow;
}

/**
 * Generate implementation instructions
 */
function generateImplementationInstructions(opportunity, platform, industryType) {
  const platformInstructions = {
    n8n: [
      '1. Import workflow JSON into n8n workspace',
      '2. Configure API credentials and database connections',
      '3. Set up trigger schedule and conditions',
      '4. Test workflow with sample data',
      '5. Deploy to production and monitor'
    ],
    zapier: [
      '1. Create new Zap with trigger configuration',
      '2. Set up action steps based on workflow design',
      '3. Configure data mapping and transformations',
      '4. Test Zap with live data',
      '5. Enable and monitor automation'
    ],
    make: [
      '1. Create new scenario in Make platform',
      '2. Configure modules and connections',
      '3. Set up data flow and transformations',
      '4. Test scenario thoroughly',
      '5. Activate and schedule for production'
    ]
  };

  const industryNotes = {
    hospitality: '• Ensure guest privacy and data protection\n• Consider peak operation times for scheduling',
    restaurant: '• Account for food safety compliance requirements\n• Schedule around service periods',
    medical: '• Ensure HIPAA compliance in all automations\n• Include patient safety considerations',
    general: '• Follow organizational security policies\n• Consider business hour constraints'
  };

  const instructions = platformInstructions[platform] || platformInstructions.n8n;
  const industryNote = industryNotes[industryType] || industryNotes.general;

  return `${instructions.join('\n')}\n\nIndustry-Specific Considerations:\n${industryNote}`;
}