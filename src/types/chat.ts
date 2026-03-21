/**
 * Centralized chat domain types
 * Single source of truth for ChatInstance, Message, and related types
 */

import type { User } from "@supabase/supabase-js";

/**
 * Chat instance as stored in database
 */
export interface ChatInstance {
  id: string;
  name: string;
  slug: string | null;
  webhook_url: string;
  user_id: string;
  is_active?: boolean;
  created_at?: string;
  chat_type?: "public" | "authenticated";
  n8n_auth_enabled?: boolean;
  n8n_auth_username?: string;
  n8n_auth_password?: string;
  custom_branding: ChatInstanceBranding;
}

/**
 * Minimal branding stored on chat_instances.custom_branding
 * Full branding config is ChatBranding from chatConfiguration.ts
 * Uses `any` for extra fields since this is a dynamic JSON blob from DB
 */
export interface ChatInstanceBranding {
  primaryColor: string;
  accentColor?: string;
  chatTitle: string;
  avatarUrl?: string | null;
  welcomeMessage?: string;
  logoUrl?: string | null;
  [key: string]: any; // dynamic JSON fields from database
}

/**
 * Chat message (used in both public and authenticated modes)
 */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/**
 * Dashboard-enriched chat instance with analytics
 */
export interface DashboardChatInstance extends ChatInstance {
  analytics?: {
    total_views: number;
    unique_views: number;
    total_messages: number;
    active_sessions: number;
  };
}

/**
 * Type-safe user from Supabase auth
 */
export type AuthUser = User;
