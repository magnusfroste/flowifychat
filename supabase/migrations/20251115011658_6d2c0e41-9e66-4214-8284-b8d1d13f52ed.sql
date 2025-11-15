-- Fix remaining security definer view: chat_instances_public
DROP VIEW IF EXISTS public.chat_instances_public;

-- Recreate as SECURITY INVOKER (default)
CREATE VIEW public.chat_instances_public AS
SELECT 
  id,
  name,
  slug,
  chat_type,
  custom_branding,
  is_active,
  created_at
FROM public.chat_instances
WHERE is_active = true AND slug IS NOT NULL;