-- =============================================
-- GOOGLE CALENDAR INTEGRATION
-- =============================================

-- Table to store Google Calendar OAuth tokens per user
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Add google_event_id column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Index for quick lookup by google_event_id
CREATE INDEX IF NOT EXISTS idx_appointments_google_event_id ON appointments(google_event_id) WHERE google_event_id IS NOT NULL;

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON google_calendar_tokens(user_id);

-- RLS Policies
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view own tokens"
  ON google_calendar_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own tokens"
  ON google_calendar_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own tokens"
  ON google_calendar_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own tokens"
  ON google_calendar_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for server actions
CREATE POLICY "Service role full access"
  ON google_calendar_tokens FOR ALL
  USING (true)
  WITH CHECK (true);
