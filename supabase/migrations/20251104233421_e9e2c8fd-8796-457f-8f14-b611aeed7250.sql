-- Create analytics table for tracking chat engagement
CREATE TABLE public.chat_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_instance_id UUID NOT NULL REFERENCES public.chat_instances(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'message_sent', 'message_received')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_chat_analytics_chat_instance ON public.chat_analytics(chat_instance_id);
CREATE INDEX idx_chat_analytics_session ON public.chat_analytics(session_id);
CREATE INDEX idx_chat_analytics_event_type ON public.chat_analytics(event_type);
CREATE INDEX idx_chat_analytics_created_at ON public.chat_analytics(created_at);

-- Enable RLS
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert analytics (for public shared chats)
CREATE POLICY "Anyone can insert analytics"
ON public.chat_analytics
FOR INSERT
WITH CHECK (true);

-- Policy: Users can view analytics for their own chat instances
CREATE POLICY "Users can view their own chat analytics"
ON public.chat_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_instances
    WHERE chat_instances.id = chat_analytics.chat_instance_id
    AND chat_instances.user_id = auth.uid()
  )
);

-- Create a view for aggregated analytics
CREATE OR REPLACE VIEW public.chat_analytics_summary AS
SELECT 
  chat_instance_id,
  COUNT(*) FILTER (WHERE event_type = 'view') AS total_views,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'view') AS unique_views,
  COUNT(*) FILTER (WHERE event_type = 'message_sent') AS total_messages,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'message_sent') AS active_sessions,
  MAX(created_at) AS last_activity
FROM public.chat_analytics
GROUP BY chat_instance_id;

-- Grant access to the view
GRANT SELECT ON public.chat_analytics_summary TO authenticated;
GRANT SELECT ON public.chat_analytics_summary TO anon;