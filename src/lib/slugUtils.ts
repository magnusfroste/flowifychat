import { supabase } from "@/integrations/supabase/client";

// Reserved slugs that cannot be used by users
export const RESERVED_SLUGS = [
  'auth',
  'dashboard',
  'chat',
  'admin',
  'api',
  'login',
  'signup',
  'settings',
  'profile',
  'about',
  'contact',
  'pricing',
  'terms',
  'privacy',
  'help',
  'support',
  'docs',
  'blog',
];

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Validate slug format (client-side)
 */
export function isValidSlugFormat(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 50) {
    return false;
  }
  
  // Must match: lowercase alphanumeric + hyphens, start/end with alphanumeric
  const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
  return slugRegex.test(slug);
}

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Check if a slug is available in the database
 */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  if (!isValidSlugFormat(slug)) {
    return false;
  }
  
  if (isReservedSlug(slug)) {
    return false;
  }
  
  let query = supabase
    .from('chat_instances')
    .select('id')
    .eq('slug', slug);
  
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  const { data, error } = await query.single();
  
  // If no data found, slug is available
  return !data && !error;
}

/**
 * Get the full shareable URL for a slug
 */
export function getShareableUrl(slug: string): string {
  return `${window.location.origin}/${slug}`;
}