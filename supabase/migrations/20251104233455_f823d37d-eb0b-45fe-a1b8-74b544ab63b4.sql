-- Fix security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.chat_analytics_summary;

CREATE OR REPLACE VIEW public.chat_analytics_summary
WITH (security_invoker = true) AS
SELECT 
  chat_instance_id,
  COUNT(*) FILTER (WHERE event_type = 'view') AS total_views,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'view') AS unique_views,
  COUNT(*) FILTER (WHERE event_type = 'message_sent') AS total_messages,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'message_sent') AS active_sessions,
  MAX(created_at) AS last_activity
FROM public.chat_analytics
GROUP BY chat_instance_id;