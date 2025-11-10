-- Add n8n basic authentication columns to chat_instances table
ALTER TABLE public.chat_instances
ADD COLUMN n8n_auth_enabled boolean DEFAULT false,
ADD COLUMN n8n_auth_username text,
ADD COLUMN n8n_auth_password text;