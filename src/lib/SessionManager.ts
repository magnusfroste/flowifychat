import { supabase } from "@/integrations/supabase/client";

/**
 * Unified session management for authenticated chat instances
 * Database-backed session management for logged-in users only
 */
export class SessionManager {
  private chatInstanceId: string;
  private userId: string;

  constructor(chatInstanceId: string, userId: string) {
    if (!userId) {
      throw new Error('SessionManager requires an authenticated user. For public chats, do not use SessionManager.');
    }
    this.chatInstanceId = chatInstanceId;
    this.userId = userId;
  }

  /**
   * Get the storage key for this chat's current session
   */
  private getStorageKey(): string {
    return `chat_session:${this.chatInstanceId}`;
  }

  /**
   * Get the storage key for the session list
   */
  private getSessionsListKey(): string {
    return `chat_sessions:${this.chatInstanceId}`;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID from database or create a new one
   */
  async getOrCreateSession(): Promise<string> {
    // Check if user has an active session
    const { data, error } = await supabase
      .from('user_sessions')
      .select('session_id')
      .eq('user_id', this.userId)
      .eq('chat_instance_id', this.chatInstanceId)
      .order('claimed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data.session_id;
    }

    // Create new session
    return this.createNewSession();
  }

  /**
   * Switch to a specific session (just returns the sessionId now)
   */
  switchSession(sessionId: string): string {
    return sessionId;
  }

  /**
   * Create and switch to a new session in database
   */
  async createNewSession(): Promise<string> {
    const newSessionId = this.generateSessionId();
    
    // Save to database
    await supabase.from('user_sessions').upsert({
      user_id: this.userId,
      chat_instance_id: this.chatInstanceId,
      session_id: newSessionId,
    });

    return newSessionId;
  }

  /**
   * Get all session IDs for this authenticated user
   */
  async getAllSessions(): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('session_id')
      .eq('user_id', this.userId)
      .eq('chat_instance_id', this.chatInstanceId);

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return data.map(row => row.session_id);
  }

  /**
   * Delete a session and all its messages
   */
  async deleteSession(sessionId: string): Promise<void> {
    // Delete messages
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)
      .eq('chat_instance_id', this.chatInstanceId);

    if (messagesError) throw messagesError;

    // Delete from user_sessions
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', this.userId)
      .eq('chat_instance_id', this.chatInstanceId);

    if (sessionError) throw sessionError;
  }
}

