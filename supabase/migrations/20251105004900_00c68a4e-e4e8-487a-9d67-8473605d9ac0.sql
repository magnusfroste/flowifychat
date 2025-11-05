-- Create messages table for conversation history
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_instance_id UUID NOT NULL REFERENCES public.chat_instances(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by session
CREATE INDEX idx_chat_messages_session ON public.chat_messages(chat_instance_id, session_id, created_at);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages for their own chat instances
CREATE POLICY "Users can view their own chat messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_instances
    WHERE chat_instances.id = chat_messages.chat_instance_id
    AND chat_instances.user_id = auth.uid()
  )
);

-- Policy: Anyone can view messages for public chats (via slug)
CREATE POLICY "Anyone can view public chat messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_instances
    WHERE chat_instances.id = chat_messages.chat_instance_id
    AND chat_instances.slug IS NOT NULL
  )
);

-- Policy: Anyone can insert messages (for both owners and public users)
CREATE POLICY "Anyone can insert chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (true);

-- Policy: Users can delete messages from their own chat instances
CREATE POLICY "Users can delete their own chat messages"
ON public.chat_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_instances
    WHERE chat_instances.id = chat_messages.chat_instance_id
    AND chat_instances.user_id = auth.uid()
  )
);