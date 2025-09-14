-- Quick Fix: Create minimal organizations table to resolve health check
-- Execute this in Supabase Dashboard > SQL Editor > New Query

-- Create basic organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  plan TEXT DEFAULT 'free',
  industry_type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create a demo organization for testing
INSERT INTO public.organizations (id, name, slug, description, industry_type) VALUES
('org_demo_general', 'Demo Organization', 'demo-org', 'Demo organization for testing', 'general')
ON CONFLICT (id) DO NOTHING;