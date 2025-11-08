-- Create user_sessions table to link users to their claimed sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_instance_id uuid NOT NULL REFERENCES chat_instances(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  claimed_at timestamp with time zone DEFAULT now(),
  
  -- Ensure a session can only be claimed once per chat instance
  UNIQUE(chat_instance_id, session_id)
);

-- Add index for faster lookups
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id, chat_instance_id);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own claimed sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can claim new sessions (insert)
CREATE POLICY "Users can claim sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);