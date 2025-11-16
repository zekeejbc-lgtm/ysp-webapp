-- YSP Supabase Migration Schema
-- Generated: 2025-11-16
-- Source: Google Sheets (1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU)

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_code TEXT UNIQUE NOT NULL, -- Column S (index 18)
  username TEXT UNIQUE NOT NULL, -- Column N (index 13)
  password_hash TEXT NOT NULL, -- Column O (index 14) - will be hashed during migration
  
  -- Personal Information
  full_name TEXT NOT NULL, -- Column D (index 3)
  email TEXT, -- Column B (index 1)
  personal_email TEXT, -- Column M (index 12)
  date_of_birth DATE, -- Column E (index 4)
  age INTEGER, -- Column F (index 5)
  gender TEXT, -- Column G (index 6)
  pronouns TEXT, -- Column H (index 7)
  civil_status TEXT, -- Column I (index 8)
  contact_number TEXT, -- Column J (index 9)
  religion TEXT, -- Column K (index 10)
  nationality TEXT, -- Column L (index 11)
  
  -- Organization Details
  position TEXT, -- Column T (index 19)
  role TEXT NOT NULL, -- Column U (index 20): Admin, Head, Auditor, Member, Guest, Banned
  profile_picture_url TEXT, -- Column V (index 21)
  
  -- Data Privacy & Consent
  data_privacy_agreement TEXT, -- Column C (index 2)
  data_privacy_acknowledgment TEXT, -- Column P (index 15)
  truthfulness_declaration TEXT, -- Column Q (index 16)
  data_collection_agreement TEXT, -- Column R (index 17)
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Column A (index 0)
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT valid_role CHECK (role IN ('Admin', 'Head', 'Auditor', 'Member', 'Guest', 'Banned'))
);

-- Indexes for quick lookups
CREATE INDEX idx_user_profiles_id_code ON user_profiles(id_code);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_position ON user_profiles(position);

-- ============================================
-- ACCESS LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Column A (index 0)
  account_created TIMESTAMPTZ, -- Column B (index 1)
  email TEXT, -- Column C (index 2)
  id_code TEXT, -- Column D (index 3)
  name TEXT, -- Column E (index 4)
  role TEXT, -- Column F (index 5)
  
  -- Foreign key reference
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp DESC);
CREATE INDEX idx_access_logs_id_code ON access_logs(id_code);
CREATE INDEX idx_access_logs_role ON access_logs(role);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL, -- e.g., "0001", "0002"
  name TEXT NOT NULL,
  date DATE NOT NULL,
  time_in TEXT, -- Header value like "Time IN"
  time_out TEXT, -- Header value like "Time OUT"
  status TEXT DEFAULT 'Active', -- Active/Inactive
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_event_id ON events(event_id);
CREATE INDEX idx_events_date ON events(date DESC);
CREATE INDEX idx_events_status ON events(status);

-- ============================================
-- ATTENDANCE RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  id_code TEXT NOT NULL, -- Column A (index 0)
  name TEXT, -- Column B (index 1)
  position TEXT, -- Column C (index 2)
  id_number TEXT, -- Column D (index 3)
  
  -- Event reference
  event_id TEXT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  
  -- Attendance data
  time_in TEXT, -- e.g., "Present - 01:52 AM", "Late - 02:30 PM", "Absent - 05:02 PM"
  time_out TEXT, -- e.g., "Present - 01:52 AM"
  status TEXT, -- Parsed from time_in: Present, Late, Absent, Excused, Not Recorded
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one attendance record per user per event
  UNIQUE(id_code, event_id)
);

CREATE INDEX idx_attendance_id_code ON attendance_records(id_code);
CREATE INDEX idx_attendance_event_id ON attendance_records(event_id);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id TEXT UNIQUE NOT NULL, -- Column B (index 1): ANN-YYYY-###
  
  -- Author information
  author_id_code TEXT, -- Column C (index 2)
  author_name TEXT, -- Column D (index 3)
  
  -- Content
  title TEXT NOT NULL, -- Column E (index 4)
  subject TEXT, -- Column F (index 5)
  body TEXT, -- Column G (index 6)
  
  -- Targeting
  recipient_type TEXT, -- Column H (index 7): All Members, Only Heads, Specific Committee, Specific Person/s
  recipient_value TEXT, -- Column I (index 8)
  
  -- Email status
  email_status TEXT, -- Column J (index 9)
  
  -- Metadata
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Column A (index 0)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_id ON announcements(announcement_id);
CREATE INDEX idx_announcements_author ON announcements(author_id_code);
CREATE INDEX idx_announcements_timestamp ON announcements(timestamp DESC);

-- ============================================
-- ANNOUNCEMENT READ STATUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id TEXT NOT NULL REFERENCES announcements(announcement_id) ON DELETE CASCADE,
  id_code TEXT NOT NULL, -- User's ID Code
  status TEXT NOT NULL DEFAULT 'Unread', -- Read, Unread, N/A
  
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
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id TEXT UNIQUE, -- Column I (index 8)
  
  -- Author information
  author TEXT, -- Column B (index 1)
  author_id_code TEXT, -- Column C (index 2)
  
  -- Content
  feedback_text TEXT, -- Column D (index 3)
  image_url TEXT, -- Column L (index 11)
  
  -- Reply information
  reply_timestamp TIMESTAMPTZ, -- Column E (index 4)
  replier TEXT, -- Column F (index 5)
  replier_id TEXT, -- Column G (index 6)
  reply TEXT, -- Column H (index 7)
  
  -- Metadata
  anonymous BOOLEAN DEFAULT FALSE, -- Column J (index 9)
  category TEXT, -- Column K (index 10)
  status TEXT, -- Column M (index 12)
  visibility TEXT, -- Column N (index 13)
  notes TEXT, -- Column O (index 14)
  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Column A (index 0)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_author ON feedback(author_id_code);
CREATE INDEX idx_feedback_timestamp ON feedback(timestamp DESC);
CREATE INDEX idx_feedback_status ON feedback(status);

-- ============================================
-- HOMEPAGE CONTENT TABLE (Key-Value Store)
-- ============================================
CREATE TABLE IF NOT EXISTS homepage_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- Column A
  value TEXT, -- Column B
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_homepage_content_key ON homepage_content(key);

-- ============================================
-- DONATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id TEXT UNIQUE, -- Column A (index 0)
  
  -- Donor information
  donor_name TEXT, -- Column C (index 2)
  contact TEXT, -- Column D (index 3)
  
  -- Donation details
  amount DECIMAL(10, 2), -- Column E (index 4)
  payment_method TEXT, -- Column F (index 5)
  campaign TEXT, -- Column G (index 6)
  reference_number TEXT, -- Column H (index 7)
  receipt_url TEXT, -- Column I (index 8)
  
  -- Status
  status TEXT, -- Column J (index 9)
  notes TEXT, -- Column K (index 10)
  verified_by TEXT, -- Column L (index 11)
  
  -- Metadata
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Column B (index 1)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_donor ON donations(donor_name);
CREATE INDEX idx_donations_campaign ON donations(campaign);
CREATE INDEX idx_donations_timestamp ON donations(timestamp DESC);

-- ============================================
-- DONATION CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS donation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT UNIQUE NOT NULL, -- Column A (index 0)
  
  name TEXT NOT NULL, -- Column B (index 1)
  description TEXT, -- Column C (index 2)
  target_amount DECIMAL(10, 2), -- Column D (index 3)
  current_amount DECIMAL(10, 2) DEFAULT 0, -- Column E (index 4)
  
  start_date DATE, -- Column F (index 5)
  end_date DATE, -- Column G (index 6)
  status TEXT DEFAULT 'Active', -- Column H (index 7)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON donation_campaigns(status);

-- ============================================
-- POLLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id TEXT UNIQUE NOT NULL, -- Column A (index 0)
  
  -- Creator information
  creator_id_code TEXT, -- Column C (index 2)
  creator_name TEXT, -- Column D (index 3)
  
  -- Poll details
  title TEXT NOT NULL, -- Column E (index 4)
  description TEXT, -- Column F (index 5)
  questions_json JSONB, -- Column G (index 6)
  
  -- Targeting
  target_audience_type TEXT, -- Column H (index 7)
  target_value TEXT, -- Column I (index 8)
  
  -- Schedule
  start_date DATE, -- Column J (index 9)
  end_date DATE, -- Column K (index 10)
  status TEXT, -- Column L (index 11)
  
  -- Settings
  anonymous BOOLEAN DEFAULT FALSE, -- Column M (index 12)
  show_results_after_vote BOOLEAN DEFAULT FALSE, -- Column N (index 13)
  show_results_after_close BOOLEAN DEFAULT TRUE, -- Column O (index 14)
  template_used TEXT, -- Column P (index 15)
  
  -- Stats
  total_votes INTEGER DEFAULT 0, -- Column Q (index 16)
  voters_list_json JSONB, -- Column R (index 17)
  
  email_sent BOOLEAN DEFAULT FALSE, -- Column S (index 18)
  
  timestamp_created TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Column B (index 1)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_creator ON polls(creator_id_code);

-- ============================================
-- POLL RESPONSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id TEXT UNIQUE NOT NULL, -- Column A (index 0)
  poll_id TEXT NOT NULL, -- Column B (index 1)
  
  -- Respondent information
  respondent_id_code TEXT, -- Column C (index 2)
  respondent_name TEXT, -- Column D (index 3)
  respondent_position TEXT, -- Column E (index 4)
  respondent_committee TEXT, -- Column F (index 5)
  
  -- Response data
  responses_json JSONB, -- Column H (index 7)
  
  timestamp_submitted TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Column G (index 6)
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
-- RLS POLICIES (Basic - customize as needed)
-- ============================================

-- User Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id::text);

-- Access Logs: Admins and Heads can view all
CREATE POLICY "Admins and Heads can view access logs" ON access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Admin', 'Head', 'Auditor')
    )
  );

-- Events: Everyone can view active events
CREATE POLICY "Anyone can view active events" ON events
  FOR SELECT USING (status = 'Active');

-- Attendance: Users can view their own attendance
CREATE POLICY "Users can view own attendance" ON attendance_records
  FOR SELECT USING (
    id_code IN (
      SELECT id_code FROM user_profiles WHERE id::text = auth.uid()::text
    )
  );

-- Announcements: Users can view announcements targeted to them
CREATE POLICY "Users can view targeted announcements" ON announcements
  FOR SELECT USING (true); -- Refine based on recipient logic

-- Feedback: Public visibility or own feedback
CREATE POLICY "Users can view public feedback" ON feedback
  FOR SELECT USING (visibility = 'Public' OR author_id_code IN (
    SELECT id_code FROM user_profiles WHERE id::text = auth.uid()::text
  ));

-- Homepage Content: Public read access
CREATE POLICY "Anyone can view homepage content" ON homepage_content
  FOR SELECT USING (true);

-- Donations: Public campaigns visible
CREATE POLICY "Anyone can view donation campaigns" ON donation_campaigns
  FOR SELECT USING (true);

-- Polls: Users can view polls targeted to them
CREATE POLICY "Users can view targeted polls" ON polls
  FOR SELECT USING (true); -- Refine based on target audience

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
