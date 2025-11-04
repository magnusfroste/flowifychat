-- Add slug column to chat_instances table
ALTER TABLE public.chat_instances 
ADD COLUMN slug text UNIQUE;

-- Add index for slug lookups (performance)
CREATE INDEX idx_chat_instances_slug ON public.chat_instances(slug);

-- Add constraint for slug format (lowercase alphanumeric + hyphens, 3-50 chars)
ALTER TABLE public.chat_instances
ADD CONSTRAINT slug_format_check 
CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$');

-- Create a function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug_from_name(name text)
RETURNS text
LANGUAGE plpgsql
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

-- Update RLS policy to allow public SELECT by slug
CREATE POLICY "Anyone can view chat instances by slug"
ON public.chat_instances
FOR SELECT
USING (slug IS NOT NULL);

-- Generate slugs for existing chat instances
UPDATE public.chat_instances
SET slug = public.generate_slug_from_name(name)
WHERE slug IS NULL;