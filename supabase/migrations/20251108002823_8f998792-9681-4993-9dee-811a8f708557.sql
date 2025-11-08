-- Add hide_branding_badge field to profiles table
ALTER TABLE public.profiles
ADD COLUMN hide_branding_badge BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.hide_branding_badge IS 'When true, hides the "Powered by FlowChat" badge on all public chat pages for this user';