-- Explicitly alter view security options
-- Change chat_analytics_summary to SECURITY INVOKER
ALTER VIEW public.chat_analytics_summary SET (security_invoker = true);

-- Change chat_instances_public to SECURITY INVOKER  
ALTER VIEW public.chat_instances_public SET (security_invoker = true);