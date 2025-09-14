/**
 * Multi-Tenant SOP Generation API
 * Sprint 2 Story 1: Industry-Specific SOP Generation
 *
 * Generates SOPs with industry-specific prompts and organization context
 */

import { getAuth, clerkClient } from '@clerk/nextjs/server';
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
  const correlationId = req.headers['x-correlation-id'] || `sop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { orgId } = req.query;

  logger.info('Multi-tenant SOP generation request started', {
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
        riskLevel: 'HIGH'
      });

      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Organization context mismatch',
        correlationId
      });
    }

    const { sopContent, processDescription, customPrompt } = req.body;

    if (!sopContent && !processDescription) {
      return res.status(400).json({
        success: false,
        error: 'SOP content or process description required',
        correlationId
      });
    }

    // Get organization details and industry configuration
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError || !organization) {
      logger.error('Organization lookup failed', orgError, {
        correlationId,
        organizationId: orgId
      });

      return res.status(404).json({
        success: false,
        error: 'Organization not found',
        correlationId
      });
    }

    // Get industry-specific configuration
    const { data: industryConfig } = await supabase
      .from('organization_industry_config')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    // Get industry-specific SOP prompt template
    const industryType = industryConfig?.industry_type || organization.industry_type || 'general';

    const { data: promptTemplate } = await supabase
      .from('sop_prompt_templates')
      .select('*')
      .eq('industry_type', industryType)
      .eq('is_active', true)
      .order('template_version', { ascending: false })
      .limit(1)
      .single();

    // Build industry-specific prompt
    const basePrompt = promptTemplate?.prompt_content ||
      'Generate a comprehensive Standard Operating Procedure (SOP) for the following process.';

    // Apply custom terminology and prompt customizations
    let enhancedPrompt = basePrompt;

    if (industryConfig?.custom_terminology) {
      const terminology = industryConfig.custom_terminology;
      Object.entries(terminology).forEach(([key, value]) => {
        enhancedPrompt = enhancedPrompt.replace(new RegExp(key, 'gi'), value);
      });
    }

    if (industryConfig?.prompt_customizations?.additionalInstructions) {
      enhancedPrompt += '\n\nAdditional Requirements:\n' +
        industryConfig.prompt_customizations.additionalInstructions;
    }

    // Add compliance requirements if specified
    if (industryConfig?.compliance_requirements?.length > 0) {
      enhancedPrompt += '\n\nCompliance Requirements:\n' +
        industryConfig.compliance_requirements.map(req => `- ${req}`).join('\n');
    }

    // Use custom prompt if provided, otherwise use industry-specific prompt
    const finalPrompt = customPrompt || enhancedPrompt;

    // Prepare content for AI analysis
    const contentToAnalyze = sopContent || processDescription;

    // Call AI service for SOP generation (using existing AI infrastructure)
    const aiResponse = await callAIForSOPGeneration({
      prompt: finalPrompt,
      content: contentToAnalyze,
      industryType,
      organizationId: orgId,
      correlationId
    });

    // Log successful SOP generation for audit
    logAuditEvent(AUDIT_EVENTS.ANALYSIS_COMPLETED, {
      correlationId,
      userId: orgValidation.userId,
      organizationId: orgId,
      resource: 'sop_generation',
      industryType,
      contentLength: contentToAnalyze.length,
      promptTemplate: promptTemplate?.template_name || 'default',
      customPromptUsed: !!customPrompt
    });

    const processingTime = Date.now() - startTime;

    logger.info('Multi-tenant SOP generation completed', {
      correlationId,
      organizationId: orgId,
      industryType,
      processingTime,
      aiProvider: aiResponse.provider,
      success: true
    });

    return res.status(200).json({
      success: true,
      data: {
        sopAnalysis: aiResponse.analysis,
        industryType,
        promptTemplate: promptTemplate?.template_name || 'default',
        organizationId: orgId,
        processingTime,
        correlationId
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('Multi-tenant SOP generation failed', error, {
      correlationId,
      organizationId: orgId,
      processingTime,
      errorMessage: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'SOP generation failed',
      correlationId,
      processingTime
    });
  }
}

/**
 * Call AI service for SOP generation with industry context
 */
async function callAIForSOPGeneration({ prompt, content, industryType, organizationId, correlationId }) {
  // Check for Claude API availability first
  if (process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'demo_claude_api_key_for_testing') {
    try {
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\nProcess/SOP Content:\n${content}`
            }
          ]
        })
      });

      if (claudeResponse.ok) {
        const claudeData = await claudeResponse.json();

        logger.info('Claude SOP generation successful', {
          correlationId,
          organizationId,
          industryType,
          inputTokens: claudeData.usage?.input_tokens,
          outputTokens: claudeData.usage?.output_tokens
        });

        return {
          provider: 'claude',
          analysis: claudeData.content[0]?.text || 'Analysis completed',
          usage: claudeData.usage
        };
      }
    } catch (claudeError) {
      logger.warn('Claude SOP generation failed, trying OpenAI fallback', {
        correlationId,
        error: claudeError.message
      });
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo_openai_api_key_for_testing') {
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\nProcess/SOP Content:\n${content}`
            }
          ],
          max_tokens: 4000
        })
      });

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json();

        logger.info('OpenAI SOP generation successful', {
          correlationId,
          organizationId,
          industryType,
          inputTokens: openaiData.usage?.prompt_tokens,
          outputTokens: openaiData.usage?.completion_tokens
        });

        return {
          provider: 'openai',
          analysis: openaiData.choices[0]?.message?.content || 'Analysis completed',
          usage: openaiData.usage
        };
      }
    } catch (openaiError) {
      logger.error('OpenAI SOP generation failed', openaiError, {
        correlationId,
        organizationId
      });
    }
  }

  // Fallback to demo response if no AI providers available
  logger.info('Using demo SOP analysis (no AI providers configured)', {
    correlationId,
    organizationId,
    industryType
  });

  return {
    provider: 'demo',
    analysis: `Demo SOP Analysis for ${industryType} industry:\n\nThis is a demo analysis that would be generated by AI providers. The analysis would include:\n\n1. Industry-specific recommendations\n2. ${industryType === 'hospitality' ? 'Guest service' : industryType === 'restaurant' ? 'Food safety' : 'Industry-standard'} protocols\n3. Compliance requirements for ${industryType} industry\n4. Best practices and automation opportunities\n\nTo see real AI analysis, configure your Claude or OpenAI API keys.`,
    usage: { demo: true }
  };
}