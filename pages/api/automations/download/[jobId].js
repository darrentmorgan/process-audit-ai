import { createClient } from '@supabase/supabase-js';
import { getAutomation } from '../../../../utils/jobStore';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
    // Try in-memory store first (for local processing)
    const memoryAutomation = getAutomation(jobId);
    if (memoryAutomation) {
      const filename = `${(memoryAutomation.name || 'n8n_workflow').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return res.status(200).json(memoryAutomation.workflow_json);
    }
    
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    // Fetch the generated automation from Supabase
    const { data: automation, error } = await supabase
      .from('generated_automations')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error || !automation) {
      console.error('Error fetching automation:', error);
      return res.status(404).json({ error: 'Automation not found' });
    }

    // Set headers for file download
    const filename = `${automation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_n8n_workflow.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send the workflow JSON
    res.status(200).json(automation.workflow_json);

  } catch (error) {
    console.error('Error downloading automation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}