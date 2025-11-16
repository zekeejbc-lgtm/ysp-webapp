-- Drop all existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS poll_responses CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS donation_campaigns CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS homepage_content CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS announcement_read_status CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Now create everything fresh
-- YSP Supabase Migration Schema
-- Generated: 2025-11-16
-- Source: Google Sheets (1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU)

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_code TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT,
  personal_email TEXT,
  date_of_birth DATE,
  age INTEGER,
  gender TEXT,
  pronouns TEXT,
  civil_status TEXT,
  contact_number TEXT,
  religion TEXT,
  nationality TEXT,
  
  -- Organization Details
  position TEXT,
  role TEXT NOT NULL,
  profile_picture_url TEXT,
  
  -- Data Privacy & Consent
  data_privacy_agreement TEXT,
  data_privacy_acknowledgment TEXT,
  truthfulness_declaration TEXT,
  data_collection_agreement TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN ('Admin', 'Head', 'Auditor', 'Member', 'Guest', 'Banned'))
);

CREATE INDEX idx_user_profiles_id_code ON user_profiles(id_code);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_position ON user_profiles(position);

-- ============================================
-- ACCESS LOGS TABLE
-- ============================================
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  account_created TIMESTAMPTZ,
  email TEXT,
  id_code TEXT,
  name TEXT,
  role TEXT,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp DESC);
CREATE INDEX idx_access_logs_id_code ON access_logs(id_code);
CREATE INDEX idx_access_logs_role ON access_logs(role);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  time_in TEXT,
  time_out TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_event_id ON events(event_id);
CREATE INDEX idx_events_date ON events(date DESC);
CREATE INDEX idx_events_status ON events(status);

-- ============================================
-- ATTENDANCE RECORDS TABLE
-- ============================================
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_code TEXT NOT NULL,
  name TEXT,
  position TEXT,
  id_number TEXT,
  event_id TEXT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  time_in TEXT,
  time_out TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_code, event_id)
);

CREATE INDEX idx_attendance_id_code ON attendance_records(id_code);
CREATE INDEX idx_attendance_event_id ON attendance_records(event_id);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id TEXT UNIQUE NOT NULL,
  author_id_code TEXT,
  author_name TEXT,
  title TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  recipient_type TEXT,
  recipient_value TEXT,
  email_status TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_id ON announcements(announcement_id);
CREATE INDEX idx_announcements_author ON announcements(author_id_code);
CREATE INDEX idx_announcements_timestamp ON announcements(timestamp DESC);

-- ============================================
-- ANNOUNCEMENT READ STATUS TABLE
-- ============================================
CREATE TABLE announcement_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id TEXT NOT NULL REFERENCES announcements(announcement_id) ON DELETE CASCADE,
  id_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Unread',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, id_code),
  CONSTRAINT valid_status CHECK (status IN ('Read', 'Unread', 'N/A'))
);

CREATE INDEX idx_announcement_status_user ON announcement_read_status(id_code);
CREATE INDEX idx_announcement_status_announcement ON announcement_read_status(announcement_id);

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id TEXT UNIQUE,
  author TEXT,
  author_id_code TEXT,
  feedback_text TEXT,
  image_url TEXT,
  reply_timestamp TIMESTAMPTZ,
  replier TEXT,
  replier_id TEXT,
  reply TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  category TEXT,
  status TEXT,
  visibility TEXT,
  notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_author ON feedback(author_id_code);
CREATE INDEX idx_feedback_timestamp ON feedback(timestamp DESC);
CREATE INDEX idx_feedback_status ON feedback(status);

-- ============================================
-- HOMEPAGE CONTENT TABLE
-- ============================================
CREATE TABLE homepage_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_homepage_content_key ON homepage_content(key);

-- ============================================
-- DONATIONS TABLE
-- ============================================
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id TEXT UNIQUE,
  donor_name TEXT,
  contact TEXT,
  amount DECIMAL(10, 2),
  payment_method TEXT,
  campaign TEXT,
  reference_number TEXT,
  receipt_url TEXT,
  status TEXT,
  notes TEXT,
  verified_by TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_donor ON donations(donor_name);
CREATE INDEX idx_donations_campaign ON donations(campaign);
CREATE INDEX idx_donations_timestamp ON donations(timestamp DESC);

-- ============================================
-- DONATION CAMPAIGNS TABLE
-- ============================================
CREATE TABLE donation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10, 2),
  current_amount DECIMAL(10, 2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON donation_campaigns(status);

-- ============================================
-- POLLS TABLE
-- ============================================
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id TEXT UNIQUE NOT NULL,
  creator_id_code TEXT,
  creator_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  questions_json JSONB,
  target_audience_type TEXT,
  target_value TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  show_results_after_vote BOOLEAN DEFAULT FALSE,
  show_results_after_close BOOLEAN DEFAULT TRUE,
  template_used TEXT,
  total_votes INTEGER DEFAULT 0,
  voters_list_json JSONB,
  email_sent BOOLEAN DEFAULT FALSE,
  timestamp_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_creator ON polls(creator_id_code);

-- ============================================
-- POLL RESPONSES TABLE
-- ============================================
CREATE TABLE poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id TEXT UNIQUE NOT NULL,
  poll_id TEXT NOT NULL,
  respondent_id_code TEXT,
  respondent_name TEXT,
  respondent_position TEXT,
  respondent_committee TEXT,
  responses_json JSONB,
  timestamp_submitted TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_poll_responses_poll ON poll_responses(poll_id);
CREATE INDEX idx_poll_responses_respondent ON poll_responses(respondent_id_code);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins and Heads can view access logs" ON access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Admin', 'Head', 'Auditor')
    )
  );

CREATE POLICY "Anyone can view active events" ON events
  FOR SELECT USING (status = 'Active');

CREATE POLICY "Users can view own attendance" ON attendance_records
  FOR SELECT USING (
    id_code IN (
      SELECT id_code FROM user_profiles WHERE id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can view targeted announcements" ON announcements
  FOR SELECT USING (true);

CREATE POLICY "Users can view public feedback" ON feedback
  FOR SELECT USING (visibility = 'Public' OR author_id_code IN (
    SELECT id_code FROM user_profiles WHERE id::text = auth.uid()::text
  ));

CREATE POLICY "Anyone can view homepage content" ON homepage_content
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view donation campaigns" ON donation_campaigns
  FOR SELECT USING (true);

CREATE POLICY "Users can view targeted polls" ON polls
  FOR SELECT USING (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homepage_updated_at BEFORE UPDATE ON homepage_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON donation_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON polls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
