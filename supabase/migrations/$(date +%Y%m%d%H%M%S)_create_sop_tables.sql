-- Create SOP Templates and Configurations
CREATE TABLE sop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  format TEXT CHECK (format IN ('step-by-step', 'hierarchical', 'checklist', 'flowchart')),
  template_structure JSONB NOT NULL,
  numbering_scheme JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Generated SOP Documents
CREATE TABLE generated_sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_report_id UUID REFERENCES audit_reports(id),
  organization_id UUID REFERENCES organizations(id), 
  document_number TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  format TEXT NOT NULL,
  pdf_url TEXT,
  file_size INTEGER,
  generation_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SOP Download Tracking
CREATE TABLE sop_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID REFERENCES generated_sops(id),
  user_id UUID REFERENCES auth.users(id),
  download_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create RLS Policies for Multi-Tenant Security
ALTER TABLE sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_downloads ENABLE ROW LEVEL SECURITY;

-- Policy for SOP Templates: Only visible to organization members
CREATE POLICY "Sop templates visible to org members" ON sop_templates
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = sop_templates.organization_id
    )
  );

-- Policy for Generated SOPs: Only visible to organization members
CREATE POLICY "Generated SOPs visible to org members" ON generated_sops
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members
      WHERE organization_id = generated_sops.organization_id
    )
  );

-- Policy for SOP Downloads: Only own downloads allowed
CREATE POLICY "Users can see own sop downloads" ON sop_downloads
  FOR SELECT
  USING (auth.uid() = user_id);