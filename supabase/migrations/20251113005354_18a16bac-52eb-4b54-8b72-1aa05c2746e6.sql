-- Fix search_path for enforce_chat_instance_limit function
CREATE OR REPLACE FUNCTION public.enforce_chat_instance_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  plan_info record;
BEGIN
  -- Get user's plan
  SELECT * INTO plan_info
  FROM get_user_plan(NEW.user_id);
  
  -- Check limit
  IF NOT plan_info.can_create_more_chats THEN
    RAISE EXCEPTION 'Chat instance limit reached. Upgrade to Pro for unlimited chats.';
  END IF;
  
  RETURN NEW;
END;
$function$;