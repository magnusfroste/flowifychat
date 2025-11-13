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
  
  const { data, error } = await query.maybeSingle();
  
  // If error occurred, assume slug is not available (safer approach)
  if (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }
  
  // If no data found, slug is available
  return !data;
}

/**
 * Get the full shareable URL for a slug
 */
export function getShareableUrl(slug: string): string {
  return `${window.location.origin}/${slug}`;
}

/**
 * Generate a random, friendly chat name
 * Returns names like "Happy Dolphin 4832" or "Bright Ocean 7291"
 */
export function generateRandomChatName(): string {
  const adjectives = [
    'Happy', 'Bright', 'Sunny', 'Swift', 'Calm', 'Clear', 
    'Fresh', 'Quick', 'Smart', 'Bold', 'Kind', 'Gentle',
    'Wise', 'Brave', 'Noble', 'Pure', 'Warm', 'Cool'
  ];
  
  const nouns = [
    'Dolphin', 'Mountain', 'Ocean', 'River', 'Forest', 'Cloud',
    'Breeze', 'Thunder', 'Phoenix', 'Eagle', 'Tiger', 'Panda',
    'Wave', 'Storm', 'Star', 'Moon', 'Sun', 'Sky'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  // Add timestamp for guaranteed uniqueness
  const timestamp = Date.now().toString().slice(-4);
  
  return `${adjective} ${noun} ${timestamp}`;
}