-- Enable realtime for chat_messages table to support live session updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;