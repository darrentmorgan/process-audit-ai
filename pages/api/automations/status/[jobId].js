import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    const supabase = getSupabase();
    
    if (!supabase) {
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'Supabase environment variables are missing. Cannot check job status without database connection.',
        missing: {
          url: !process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      });
    }

    // Get job status from Supabase
    const { data: job, error } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      console.error('Error fetching job:', error);
      return res.status(404).json({ 
        error: 'Job not found',
        jobId,
        details: error?.message || 'Job does not exist in database',
        code: error?.code
      });
    }

    // If job is completed, also fetch the generated automation
    let automation = null;
    if (job.status === 'completed') {
      const { data: automationData } = await supabase
        .from('generated_automations')
        .select('*')
        .eq('job_id', jobId)
        .single();
      
      automation = automationData || null;
    }

    res.status(200).json({
      job,
      automation,
    });

  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}