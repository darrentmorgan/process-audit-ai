-- ProcessAudit AI Database Schema
-- Run these commands in your Supabase SQL editor

-- Note: JWT secret is managed by Supabase automatically

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create audit_reports table
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Process Audit Report',
  process_description TEXT NOT NULL,
  file_content TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  report_data JSONB NOT NULL DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS audit_reports_user_id_idx ON audit_reports(user_id);
CREATE INDEX IF NOT EXISTS audit_reports_created_at_idx ON audit_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_reports_tags_idx ON audit_reports USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for audit_reports
CREATE POLICY "Users can view their own audit reports"
  ON public.audit_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit reports"
  ON public.audit_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audit reports"
  ON public.audit_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audit reports"
  ON public.audit_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_audit_reports_updated_at
  BEFORE UPDATE ON public.audit_reports
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.audit_reports TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Optional: Create some sample views for analytics (admin only)
CREATE OR REPLACE VIEW public.audit_stats AS
SELECT
  COUNT(*) as total_reports,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_completion_time_minutes,
  DATE_TRUNC('day', created_at) as date
FROM public.audit_reports
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Note: Remember to set up your environment variables:
-- NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key