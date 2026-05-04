import { createClient } from '@supabase/supabase-js';

function getConfig() {
  const url = localStorage.getItem('jobtracker_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('jobtracker_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
}

let _client = null;

export function getSupabase() {
  const { url, key } = getConfig();
  if (!url || !key) return null;
  if (!_client) {
    _client = createClient(url, key);
  }
  return _client;
}

export function resetSupabaseClient() {
  _client = null;
}

export function isSupabaseConfigured() {
  const { url, key } = getConfig();
  return !!(url && key);
}

export function saveSupabaseConfig(url, key) {
  localStorage.setItem('jobtracker_supabase_url', url);
  localStorage.setItem('jobtracker_supabase_key', key);
  resetSupabaseClient();
}

// SQL to initialize the database — user runs this in Supabase SQL editor
export const INIT_SQL = `
-- Applications pipeline
CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    city TEXT,
    state TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    job_type TEXT,
    employment_type TEXT,
    work_mode TEXT,
    status TEXT DEFAULT 'saved',
    close_reason TEXT,
    source_url TEXT,
    source_site TEXT,
    description TEXT,
    contact_id UUID,
    resume_id UUID,
    applied_date TIMESTAMPTZ,
    follow_up_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts CRM
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    company TEXT,
    phone TEXT,
    email TEXT,
    linkedin_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Call log
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    application_id UUID,
    call_date TIMESTAMPTZ DEFAULT now(),
    duration_minutes INTEGER,
    outcome TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Resume versions
CREATE TABLE IF NOT EXISTS resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    target_industry TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resume submissions
CREATE TABLE IF NOT EXISTS resume_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    application_id UUID,
    company TEXT NOT NULL,
    submitted_date TIMESTAMPTZ DEFAULT now(),
    method TEXT,
    status TEXT DEFAULT 'sent',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    query TEXT NOT NULL,
    location TEXT,
    job_type TEXT,
    filters JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks / reminders
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    notes TEXT,
    priority TEXT DEFAULT 'normal',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    application_id UUID,
    contact_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Interview events
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    notes TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    location TEXT,
    meeting_link TEXT,
    application_id UUID,
    contact_id UUID,
    kind TEXT DEFAULT 'interview',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security) - open for anon access since this is a personal tool
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (personal tool)
CREATE POLICY "Allow all" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON call_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON resumes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON resume_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON saved_searches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON events FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Allow all uploads" ON storage.objects FOR ALL USING (bucket_id = 'resumes') WITH CHECK (bucket_id = 'resumes');
`;
