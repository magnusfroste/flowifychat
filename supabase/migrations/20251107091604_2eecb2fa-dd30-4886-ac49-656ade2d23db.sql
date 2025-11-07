-- Remove the demo chat instance so it can be created manually
DELETE FROM public.chat_instances WHERE slug = 'demo';