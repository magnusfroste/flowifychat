-- Fix: Allow users to delete their own messages based on session ownership
-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.chat_messages;

-- Create new policy that allows deletion for:
-- 1. Chat instance owners (existing behavior)
-- 2. Users who own the session (via user_sessions table)
CREATE POLICY "Users can delete their own chat messages"
  ON public.chat_messages
  FOR DELETE
  USING (
    -- Chat instance owner can delete any message in their chat
    EXISTS (
      SELECT 1 FROM chat_instances
      WHERE chat_instances.id = chat_messages.chat_instance_id
      AND chat_instances.user_id = auth.uid()
    )
    OR
    -- Session owner can delete their own session's messages
    EXISTS (
      SELECT 1 FROM user_sessions
      WHERE user_sessions.session_id = chat_messages.session_id
      AND user_sessions.chat_instance_id = chat_messages.chat_instance_id
      AND user_sessions.user_id = auth.uid()
    )
  );