/**
 * Organization Industry Configuration API
 * Sprint 2 Story 1: Multi-Tenant Industry Configuration Management
 *
 * Manages industry-specific configuration for SOP generation
 */

import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { validateOrganizationContext, validateOrganizationPermissions } from '../../../../utils/security/organization-context-validator';
import { logAuditEvent, AUDIT_EVENTS } from '../../../../utils/security/audit-logger';
import { logger } from '../../../../utils/logger';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { orgId } = req.query;
  const correlationId = req.headers['x-correlation-id'] || `industry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info('Industry configuration API request', {
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
        resource: 'industry_configuration'
      });

      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Organization context mismatch',
        correlationId
      });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        return await handleGetIndustryConfig(req, res, orgValidation, correlationId);

      case 'PUT':
        return await handleUpdateIndustryConfig(req, res, orgValidation, correlationId);

      case 'POST':
        return await handleCreateIndustryConfig(req, res, orgValidation, correlationId);

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'POST']);
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`,
          correlationId
        });
    }

  } catch (error) {
    logger.error('Industry configuration API error', error, {
      correlationId,
      organizationId: orgId,
      method: req.method
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      correlationId
    });
  }
}

/**
 * Get industry configuration for organization
 */
async function handleGetIndustryConfig(req, res, orgValidation, correlationId) {
  const { organizationId } = orgValidation;

  try {
    // Get organization industry configuration
    const { data: industryConfig, error: configError } = await supabase
      .from('organization_industry_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // Get organization basic info
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, industry_type, plan')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      throw new Error(`Organization lookup failed: ${orgError.message}`);
    }

    // Get available SOP templates for current industry
    const currentIndustry = industryConfig?.industry_type || organization?.industry_type || 'general';

    const { data: availableTemplates } = await supabase
      .from('sop_prompt_templates')
      .select('industry_type, template_name, template_description')
      .eq('industry_type', currentIndustry)
      .eq('is_active', true);

    const response = {
      organizationId,
      organizationName: organization.name,
      currentIndustryType: currentIndustry,
      industryConfig: industryConfig || {
        industry_type: currentIndustry,
        industry_subtype: null,
        compliance_requirements: [],
        custom_terminology: {},
        prompt_customizations: {},
        sop_preferences: {}
      },
      availableTemplates: availableTemplates || [],
      supportedIndustries: [
        'general',
        'restaurant',
        'hospitality',
        'medical',
        'manufacturing',
        'retail',
        'professional_services'
      ]
    };

    logAuditEvent(AUDIT_EVENTS.DATA_ACCESSED, {
      correlationId,
      userId: orgValidation.userId,
      organizationId,
      resource: 'industry_configuration',
      action: 'read'
    });

    return res.status(200).json({
      success: true,
      data: response,
      correlationId
    });

  } catch (error) {
    logger.error('Get industry configuration failed', error, {
      correlationId,
      organizationId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve industry configuration',
      correlationId
    });
  }
}

/**
 * Update industry configuration for organization
 */
async function handleUpdateIndustryConfig(req, res, orgValidation, correlationId) {
  const { organizationId, userId, membership } = orgValidation;

  // Validate admin permissions for industry configuration changes
  const permissions = validateOrganizationPermissions(orgValidation, 'write', 'industry_configuration');

  if (!permissions.allowed) {
    logAuditEvent(AUDIT_EVENTS.SECURITY_VIOLATION, {
      correlationId,
      userId,
      organizationId,
      violationType: 'insufficient_permissions',
      resource: 'industry_configuration',
      action: 'update',
      blocked: true
    });

    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions: Admin role required for industry configuration',
      requiredRole: 'admin',
      userRole: permissions.userRole,
      correlationId
    });
  }

  const {
    industry_type,
    industry_subtype,
    compliance_requirements,
    custom_terminology,
    prompt_customizations,
    sop_preferences
  } = req.body;

  // Validate industry type
  const validIndustries = ['general', 'restaurant', 'hospitality', 'medical', 'manufacturing', 'retail', 'professional_services'];
  if (industry_type && !validIndustries.includes(industry_type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid industry type',
      validIndustries,
      correlationId
    });
  }

  try {
    // Check if configuration exists
    const { data: existingConfig } = await supabase
      .from('organization_industry_config')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    const configData = {
      organization_id: organizationId,
      industry_type,
      industry_subtype,
      compliance_requirements: compliance_requirements || [],
      custom_terminology: custom_terminology || {},
      prompt_customizations: prompt_customizations || {},
      sop_preferences: sop_preferences || {},
      updated_by: userId,
      updated_at: new Date().toISOString()
    };

    let result;

    if (existingConfig) {
      // Update existing configuration
      const { data, error } = await supabase
        .from('organization_industry_config')
        .update(configData)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new configuration
      const { data, error } = await supabase
        .from('organization_industry_config')
        .insert({
          ...configData,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Also update the organization's industry_type
    if (industry_type) {
      await supabase
        .from('organizations')
        .update({ industry_type, updated_at: new Date().toISOString() })
        .eq('id', organizationId);
    }

    logAuditEvent(AUDIT_EVENTS.DATA_UPDATED, {
      correlationId,
      userId,
      organizationId,
      resource: 'industry_configuration',
      action: existingConfig ? 'update' : 'create',
      changes: {
        industry_type,
        industry_subtype,
        compliance_requirements_count: compliance_requirements?.length || 0,
        custom_terminology_keys: Object.keys(custom_terminology || {}).length,
        prompt_customizations_set: !!prompt_customizations
      }
    });

    logger.info('Industry configuration updated successfully', {
      correlationId,
      organizationId,
      industryType: industry_type,
      action: existingConfig ? 'update' : 'create'
    });

    return res.status(200).json({
      success: true,
      data: result,
      action: existingConfig ? 'updated' : 'created',
      correlationId
    });

  } catch (error) {
    logger.error('Update industry configuration failed', error, {
      correlationId,
      organizationId,
      userId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to update industry configuration',
      correlationId
    });
  }
}

/**
 * Create industry configuration for organization
 */
async function handleCreateIndustryConfig(req, res, orgValidation, correlationId) {
  // Redirect to update handler which handles both create and update
  return handleUpdateIndustryConfig(req, res, orgValidation, correlationId);
}