-- Fix function search_path security issue
CREATE OR REPLACE FUNCTION public.generate_slug_from_name(name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(regexp_replace(name, '[^a-z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  -- Limit length to 50 characters
  base_slug := substring(base_slug from 1 for 50);
  
  final_slug := base_slug;
  
  -- Check if slug exists, add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.chat_instances WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;