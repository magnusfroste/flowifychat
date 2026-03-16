export interface AdminChatInstance {
  id: string;
  name: string;
  slug: string | null;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
  chat_type?: 'public' | 'authenticated';
  custom_branding: any;
  analytics?: {
    total_views: number;
    unique_views: number;
    total_messages: number;
    active_sessions: number;
  };
}

export type AdminActiveTab = 'dashboard' | string; // string = chatInstanceId
export type AdminActiveView = 'overview' | 'chat' | 'design' | 'settings' | 'sessions';
