-- Create automation_jobs table for tracking job processing
CREATE TABLE IF NOT EXISTS automation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audit_report_id UUID REFERENCES audit_reports(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  automation_type VARCHAR(50) CHECK (automation_type IN ('n8n', 'zapier', 'make')),
  workflow_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create generated_automations table for storing completed automations
CREATE TABLE IF NOT EXISTS generated_automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES automation_jobs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('n8n', 'zapier', 'make')),
  workflow_json JSONB NOT NULL,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_automation_jobs_user_id ON automation_jobs(user_id);
CREATE INDEX idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX idx_automation_jobs_audit_report_id ON automation_jobs(audit_report_id);
CREATE INDEX idx_generated_automations_job_id ON generated_automations(job_id);

-- Create updated_at trigger for automation_jobs
CREATE OR REPLACE FUNCTION update_automation_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automation_jobs_updated_at
  BEFORE UPDATE ON automation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_jobs_updated_at();

-- Add RLS policies
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_automations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own automation jobs
CREATE POLICY "Users can view own automation jobs"
  ON automation_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own automation jobs
CREATE POLICY "Users can create own automation jobs"
  ON automation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own automation jobs
CREATE POLICY "Users can update own automation jobs"
  ON automation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can view automations for their jobs
CREATE POLICY "Users can view own generated automations"
  ON generated_automations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM automation_jobs
      WHERE automation_jobs.id = generated_automations.job_id
      AND automation_jobs.user_id = auth.uid()
    )
  );

-- Policy: Service role can do everything (for Worker access)
CREATE POLICY "Service role full access to automation_jobs"
  ON automation_jobs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to generated_automations"
  ON generated_automations FOR ALL
  USING (auth.role() = 'service_role');