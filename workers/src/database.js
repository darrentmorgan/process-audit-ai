/**
 * Database operations for Supabase - Multi-Tenant Organization Support
 */

/**
 * Get organization context for a job
 * @param {Object} env - Environment variables
 * @param {string} jobId - Job ID
 * @returns {Object|null} Organization context or null
 */
export async function getJobOrganizationContext(env, jobId) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn(`Supabase not configured - cannot get organization context for ${jobId}`);
    return null;
  }

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/automation_jobs?id=eq.${jobId}&select=organization_id,user_id,organizations(id,name,slug,plan)`,
      {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to get organization context: ${response.statusText}`);
      return null;
    }

    const jobs = await response.json();
    if (jobs.length === 0) {
      console.warn(`Job ${jobId} not found`);
      return null;
    }

    const job = jobs[0];
    return {
      jobId,
      userId: job.user_id,
      organizationId: job.organization_id,
      organization: job.organizations || null
    };
  } catch (error) {
    console.error(`Error getting organization context for job ${jobId}:`, error.message);
    return null;
  }
}

/**
 * Get user's organization memberships
 * @param {Object} env - Environment variables  
 * @param {string} userId - User ID
 * @returns {Array} Array of organization memberships
 */
export async function getUserOrganizations(env, userId) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn(`Supabase not configured - cannot get user organizations for ${userId}`);
    return [];
  }

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/organization_memberships?user_id=eq.${userId}&status=eq.active&select=*,organizations(id,name,slug,plan)`,
      {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to get user organizations: ${response.statusText}`);
      return [];
    }

    const memberships = await response.json();
    return memberships.map(membership => ({
      membershipId: membership.id,
      role: membership.role,
      status: membership.status,
      organization: membership.organizations
    }));
  } catch (error) {
    console.error(`Error getting user organizations for ${userId}:`, error.message);
    return [];
  }
}

/**
 * Validate organization access for a user
 * @param {Object} env - Environment variables
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Object|null} Membership info if valid, null if not
 */
export async function validateOrganizationAccess(env, userId, organizationId) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn(`Supabase not configured - cannot validate organization access`);
    return null;
  }

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/organization_memberships?user_id=eq.${userId}&organization_id=eq.${organizationId}&status=eq.active`,
      {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to validate organization access: ${response.statusText}`);
      return null;
    }

    const memberships = await response.json();
    return memberships.length > 0 ? memberships[0] : null;
  } catch (error) {
    console.error(`Error validating organization access:`, error.message);
    return null;
  }
}

export async function updateJobProgress(env, jobId, progress, status, errorMessage = null) {
  // Check if Supabase is configured
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn(`Supabase not configured - skipping job progress update for ${jobId}`);
    return;
  }

  try {
    const updateData = {
      progress,
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/automation_jobs?id=eq.${jobId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Supabase update failed (${response.status}): ${errorText}`);
      throw new Error(`Failed to update job progress: ${response.statusText}`);
    }

    console.log(`Updated job ${jobId}: ${status} - ${progress}%`);
  } catch (error) {
    console.error(`Database update error for job ${jobId}:`, error.message);
    // Don't throw - let workflow generation continue even if database updates fail
  }
}

export async function saveAutomation(env, jobId, automation) {
  // Check if Supabase is configured
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn(`Supabase not configured - automation generated but not saved for ${jobId}`);
    console.log(`Generated workflow: ${automation.name} with ${automation.workflow_json?.nodes?.length || 0} nodes`);
    return automation; // Return the automation even if we can't save it
  }

  try {
    // Get organization context for this job
    const orgContext = await getJobOrganizationContext(env, jobId);
    
    const automationData = {
      job_id: jobId,
      name: automation.name,
      description: automation.description,
      platform: automation.platform,
      workflow_json: automation.workflow_json,
      instructions: automation.instructions,
      organization_id: orgContext?.organizationId || null, // Include organization context
      created_at: new Date().toISOString(),
    };

    console.log(`Saving automation for job ${jobId} in organization: ${orgContext?.organization?.name || 'Personal'}`);

    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/generated_automations`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(automationData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to save automation (${response.status}): ${errorText}`);
    } else {
      // Also update the job with the workflow data
      await fetch(
        `${env.SUPABASE_URL}/rest/v1/automation_jobs?id=eq.${jobId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            workflow_data: automation.workflow_json,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      console.log(`Saved automation for job ${jobId}`);
    }
  } catch (error) {
    console.error(`Database save error for job ${jobId}:`, error.message);
    console.log(`Generated workflow despite DB error: ${automation.name} with ${automation.workflow_json?.nodes?.length || 0} nodes`);
  }
  
  return automation; // Always return the automation
}

/**
 * Create organization-scoped automation job
 * @param {Object} env - Environment variables
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID (optional)
 * @param {Object} jobData - Job data
 * @returns {Object|null} Created job or null
 */
export async function createOrganizationAutomationJob(env, userId, organizationId, jobData) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn(`Supabase not configured - cannot create organization job`);
    return null;
  }

  try {
    // Validate organization access if organizationId is provided
    if (organizationId) {
      const access = await validateOrganizationAccess(env, userId, organizationId);
      if (!access) {
        console.error(`User ${userId} does not have access to organization ${organizationId}`);
        return null;
      }
    }

    const jobCreateData = {
      ...jobData,
      user_id: userId,
      organization_id: organizationId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/automation_jobs`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(jobCreateData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create organization job: ${errorText}`);
      return null;
    }

    const jobs = await response.json();
    const createdJob = jobs[0];
    
    console.log(`Created automation job ${createdJob.id} for organization: ${organizationId || 'Personal'}`);
    return createdJob;
  } catch (error) {
    console.error(`Error creating organization automation job:`, error.message);
    return null;
  }
}

/**
 * Get organization automation jobs with pagination
 * @param {Object} env - Environment variables
 * @param {string} organizationId - Organization ID
 * @param {Object} options - Query options {limit, offset, status}
 * @returns {Array} Array of jobs
 */
export async function getOrganizationAutomationJobs(env, organizationId, options = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn(`Supabase not configured - cannot get organization jobs`);
    return [];
  }

  try {
    const { limit = 20, offset = 0, status } = options;
    
    let query = `organization_id=eq.${organizationId}`;
    if (status) {
      query += `&status=eq.${status}`;
    }

    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/automation_jobs?${query}&order=created_at.desc&limit=${limit}&offset=${offset}&select=*,generated_automations(id,name,platform)`,
      {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to get organization jobs: ${response.statusText}`);
      return [];
    }

    const jobs = await response.json();
    console.log(`Retrieved ${jobs.length} jobs for organization ${organizationId}`);
    return jobs;
  } catch (error) {
    console.error(`Error getting organization jobs:`, error.message);
    return [];
  }
}

/**
 * Get organization usage statistics
 * @param {Object} env - Environment variables
 * @param {string} organizationId - Organization ID
 * @returns {Object|null} Usage statistics or null
 */
export async function getOrganizationUsageStats(env, organizationId) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn(`Supabase not configured - cannot get organization stats`);
    return null;
  }

  try {
    // Get automation job statistics
    const jobStatsResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/automation_jobs?organization_id=eq.${organizationId}&select=status,created_at`,
      {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Get audit report statistics
    const reportStatsResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/audit_reports?organization_id=eq.${organizationId}&select=created_at`,
      {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!jobStatsResponse.ok || !reportStatsResponse.ok) {
      console.error(`Failed to get organization usage stats`);
      return null;
    }

    const jobs = await jobStatsResponse.json();
    const reports = await reportStatsResponse.json();

    const stats = {
      totalJobs: jobs.length,
      completedJobs: jobs.filter(job => job.status === 'completed').length,
      failedJobs: jobs.filter(job => job.status === 'failed').length,
      pendingJobs: jobs.filter(job => job.status === 'pending').length,
      totalReports: reports.length,
      thisMonth: {
        jobs: jobs.filter(job => {
          const jobDate = new Date(job.created_at);
          const now = new Date();
          return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
        }).length,
        reports: reports.filter(report => {
          const reportDate = new Date(report.created_at);
          const now = new Date();
          return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
        }).length
      }
    };

    console.log(`Retrieved usage stats for organization ${organizationId}: ${stats.totalJobs} jobs, ${stats.totalReports} reports`);
    return stats;
  } catch (error) {
    console.error(`Error getting organization usage stats:`, error.message);
    return null;
  }
}