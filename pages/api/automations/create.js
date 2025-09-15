import { createClient } from '@supabase/supabase-js';
import { generateJobId } from '../../../utils/jobStore';

// Safe Supabase client creation (degrades gracefully without env)
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}




export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      auditReportId, 
      processData, 
      automationOpportunities,
      automationType = 'n8n',
      userId,
      organizationId, // NEW: Organization context
      organizationSlug // NEW: Organization slug for routing
    } = req.body;
    
    console.log('Creating automation job:', {
      auditReportId,
      automationType,
      userId,
      organizationId: organizationId || 'Personal',
      organizationSlug: organizationSlug || null
    });

    const supabase = getSupabase();
    let job;

    if (!supabase) {
      return res.status(500).json({ 
        error: 'Database not configured', 
        details: 'Supabase environment variables are missing. Cannot create automation jobs without database connection.',
        missing: {
          url: !process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      });
    }

    console.log('Creating job record in Supabase...');
    const jobId = generateJobId();
    
    // Enhanced job creation with organization context
    const jobData = {
      id: jobId,
      audit_report_id: auditReportId || null,
      user_id: userId || null, 
      organization_id: organizationId || null, // NEW: Include organization context
      automation_type: automationType,
      status: 'queued',
      progress: 0,
      metadata: {
        createdAt: new Date().toISOString(),
        organizationSlug: organizationSlug || null,
        processDataSummary: {
          hasProcessData: !!processData,
          opportunityCount: automationOpportunities?.length || 0,
          processComplexity: processData?.businessContext?.complexity || 'unknown'
        }
      }
    };
    
    const { data, error: jobError } = await supabase
      .from('automation_jobs')
      .insert(jobData)
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return res.status(500).json({ 
        error: 'Failed to create automation job', 
        details: jobError.message,
        code: jobError.code
      });
    }
    job = data;

    console.log('Job created successfully:', job);

    // Submit job to backend automation API (migrated from Workers)
    const backendUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/organizations/${organizationId}/automations/generate`;

    console.log('Using backend automation URL:', backendUrl);
    console.log('Backend deployment timestamp:', new Date().toISOString());

    console.log('Submitting to backend automation at:', backendUrl);
    
    try {
      // Enhanced worker payload with organization context
      const workerPayload = {
        id: job.id,
        jobId: job.id,  // Some workers expect jobId instead of id
        auditReportId,
        processData,
        automationOpportunities,
        automationType: automationType || 'n8n',
        userId,
        organizationId: organizationId || null, // NEW: Pass organization context to worker
        organizationSlug: organizationSlug || null,
        organizationContext: {
          workspaceType: organizationId ? 'organization' : 'personal',
          submittedAt: new Date().toISOString(),
          auditReportId,
          automationType
        }
      };
      
      console.log('Worker payload:', {
        jobId: workerPayload.jobId,
        userId: workerPayload.userId,
        organizationId: workerPayload.organizationId || 'Personal',
        workspaceType: workerPayload.organizationContext.workspaceType,
        automationType: workerPayload.automationType
      });
      
      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
          'x-correlation-id': correlationId
        },
        body: JSON.stringify({
          auditReportId,
          processData,
          automationOpportunities,
          automationType,
          preferences
        }),
      });

      if (!backendResponse.ok) {
        const error = await backendResponse.text();
        console.error('Backend automation submission failed:', error);
        
        // Update job status to failed in database
        await supabase
          .from('automation_jobs')
          .update({ 
            status: 'failed', 
            error_message: `Worker submission failed: ${error}`
          })
          .eq('id', job.id);
        
        return res.status(500).json({ 
          error: 'Worker submission failed',
          details: error,
          jobId: job.id
        });
      }

      const workerData = await workerResponse.json();
      console.log('Worker response:', workerData);
      
    } catch (error) {
      console.error('Worker connection error:', error.message);
      
      // Update job status to failed in database
      await supabase
        .from('automation_jobs')
        .update({ 
          status: 'failed', 
          error_message: `Worker connection error: ${error.message}`
        })
        .eq('id', job.id);
      
      return res.status(500).json({ 
        error: 'Worker connection failed',
        details: error.message,
        jobId: job.id
      });
    }

    res.status(200).json({
      jobId: job.id,
      status: 'queued',
      message: 'Automation generation started',
      organizationId: organizationId || null,
      workspaceType: organizationId ? 'organization' : 'personal',
      metadata: {
        automationType,
        processDataAvailable: !!processData,
        opportunityCount: automationOpportunities?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in create automation:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body (sanitized):', {
      auditReportId,
      automationType,
      userId: userId ? '[REDACTED]' : null,
      organizationId: organizationId || 'Personal',
      organizationSlug: organizationSlug || null,
      hasProcessData: !!processData,
      opportunityCount: automationOpportunities?.length || 0
    });
    console.error('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasWorkerUrl: !!process.env.CLOUDFLARE_WORKER_URL,
      nodeEnv: process.env.NODE_ENV
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString(),
      organizationId: organizationId || null,
      workspaceType: organizationId ? 'organization' : 'personal',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}