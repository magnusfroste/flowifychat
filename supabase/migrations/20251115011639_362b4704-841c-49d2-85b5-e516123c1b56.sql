-- Fix Issue 1: Add RLS policies to rate_limits table
-- Since rate_limits is managed internally by security definer functions,
-- we'll add policies that allow the functions to work while protecting direct access

-- Allow authenticated users to view their own rate limit records
CREATE POLICY "Users can view rate limits for their own chat instances"
ON public.rate_limits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_instances
    WHERE chat_instances.id = rate_limits.chat_instance_id
    AND chat_instances.user_id = auth.uid()
  )
);

-- Fix Issue 2: Recreate chat_analytics_summary view as SECURITY INVOKER
-- First drop the existing view
DROP VIEW IF EXISTS public.chat_analytics_summary;

-- Recreate without SECURITY DEFINER (uses SECURITY INVOKER by default)
CREATE VIEW public.chat_analytics_summary AS
SELECT 
  ca.chat_instance_id,
  COUNT(DISTINCT CASE WHEN ca.event_type = 'message_sent' THEN ca.id END) as total_messages,
  COUNT(DISTINCT ca.session_id) as active_sessions,
  COUNT(DISTINCT CASE WHEN ca.event_type = 'page_view' THEN ca.id END) as total_views,
  COUNT(DISTINCT CASE WHEN ca.event_type = 'page_view' THEN ca.session_id END) as unique_views,
  MAX(ca.created_at) as last_activity
FROM public.chat_analytics ca
GROUP BY ca.chat_instance_id;