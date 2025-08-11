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
      userId 
    } = req.body;

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
    const { data, error: jobError } = await supabase
      .from('automation_jobs')
      .insert({
        id: jobId,
        audit_report_id: auditReportId || null,
        user_id: userId || null, 
        automation_type: automationType,
        status: 'queued',
        progress: 0,
      })
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

    // Submit job to Cloudflare Worker (required)
    const workerUrl = process.env.CLOUDFLARE_WORKER_URL || 'https://process-audit-automation.damorgs85.workers.dev';
    
    console.log('Worker URL from env:', process.env.CLOUDFLARE_WORKER_URL);
    console.log('Using worker URL:', workerUrl);
    
    if (!workerUrl) {
      return res.status(500).json({ 
        error: 'Worker not configured',
        details: 'CLOUDFLARE_WORKER_URL environment variable is required for automation generation.',
        jobId: job.id
      });
    }

    console.log('Submitting to worker at:', workerUrl);
    
    try {
      const workerResponse = await fetch(`${workerUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: job.id,
          jobId: job.id,  // Some workers expect jobId instead of id
          auditReportId,
          processData,
          automationOpportunities,
          automationType: automationType || 'n8n',
          userId,
        }),
      });

      if (!workerResponse.ok) {
        const error = await workerResponse.text();
        console.error('Worker submission failed:', error);
        
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
    });

  } catch (error) {
    console.error('Error in create automation:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}