-- Function to get user details for a chat instance
CREATE OR REPLACE FUNCTION public.get_chat_users(chat_instance_id_param uuid)
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  avatar_url text,
  claimed_at timestamp with time zone,
  last_active timestamp with time zone,
  total_messages bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    au.email,
    p.display_name,
    p.avatar_url,
    us.claimed_at,
    MAX(cm.created_at) as last_active,
    COUNT(cm.id) as total_messages
  FROM user_sessions us
  LEFT JOIN auth.users au ON au.id = us.user_id
  LEFT JOIN profiles p ON p.id = us.user_id
  LEFT JOIN chat_messages cm ON cm.session_id = us.session_id
  WHERE us.chat_instance_id = chat_instance_id_param
  GROUP BY us.user_id, au.email, p.display_name, p.avatar_url, us.claimed_at
  ORDER BY us.claimed_at DESC;
END;
$$;