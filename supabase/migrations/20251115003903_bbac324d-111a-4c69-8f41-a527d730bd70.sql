-- Priority 1: Create public view for chat instances (secure sensitive columns)
CREATE VIEW chat_instances_public AS
SELECT 
  id,
  name,
  slug,
  custom_branding,
  chat_type,
  is_active,
  created_at
FROM chat_instances
WHERE slug IS NOT NULL AND is_active = true;

GRANT SELECT ON chat_instances_public TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view chat instances by slug" ON chat_instances;

-- Priority 2: Rate limiting infrastructure
CREATE TABLE rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action_type text NOT NULL,
  chat_instance_id uuid REFERENCES chat_instances(id) ON DELETE CASCADE,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_rate_limits_lookup ON rate_limits(identifier, action_type, chat_instance_id, window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_action_type text,
  p_chat_instance_id uuid,
  p_max_requests integer DEFAULT 20,
  p_window_minutes integer DEFAULT 1
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  SELECT COALESCE(SUM(count), 0) INTO v_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND chat_instance_id = p_chat_instance_id
    AND window_start > v_window_start;
  
  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  INSERT INTO rate_limits (identifier, action_type, chat_instance_id, window_start)
  VALUES (p_identifier, p_action_type, p_chat_instance_id, now())
  ON CONFLICT DO NOTHING;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_message_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT check_rate_limit(NEW.session_id, 'message', NEW.chat_instance_id, 20, 1) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before sending more messages.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER message_rate_limit_trigger
BEFORE INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION enforce_message_rate_limit();

CREATE OR REPLACE FUNCTION enforce_analytics_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT check_rate_limit(NEW.session_id, 'analytics', NEW.chat_instance_id, 100, 1) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER analytics_rate_limit_trigger
BEFORE INSERT ON chat_analytics
FOR EACH ROW
EXECUTE FUNCTION enforce_analytics_rate_limit();

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM rate_limits WHERE window_start < now() - interval '1 hour';
$$;

-- Priority 3: Secure storage buckets
UPDATE storage.buckets 
SET public = false 
WHERE name IN ('chat-logos', 'chat-avatars');

CREATE POLICY "Users can upload chat logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-logos' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view chat logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-logos');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-avatars' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-avatars');

-- Priority 4: Input validation constraints
ALTER TABLE chat_instances
ADD CONSTRAINT webhook_url_format CHECK (
  webhook_url IS NULL OR 
  (webhook_url ~ '^https://' AND length(webhook_url) <= 2048)
);

ALTER TABLE chat_messages
ADD CONSTRAINT message_length CHECK (
  length(content) <= 10000
);