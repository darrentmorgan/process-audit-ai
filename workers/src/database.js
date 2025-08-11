/**
 * Database operations for Supabase
 */

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
    const automationData = {
      job_id: jobId,
      name: automation.name,
      description: automation.description,
      platform: automation.platform,
      workflow_json: automation.workflow_json,
      instructions: automation.instructions,
      created_at: new Date().toISOString(),
    };

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