import { supabase } from "@/integrations/supabase/client";

/**
 * Unified session management for chat instances
 * Handles localStorage and database operations in one place
 */
export class SessionManager {
  private chatInstanceId: string;
  private userId: string | null;

  constructor(chatInstanceId: string, userId: string | null = null) {
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
   * Get current session ID or create a new one
   */
  getOrCreateSession(): string {
    const existing = localStorage.getItem(this.getStorageKey());
    
    if (existing) {
      this.ensureSessionInList(existing);
      return existing;
    }
    
    const newSessionId = this.generateSessionId();
    localStorage.setItem(this.getStorageKey(), newSessionId);
    this.ensureSessionInList(newSessionId);
    return newSessionId;
  }

  /**
   * Switch to a specific session
   */
  switchSession(sessionId: string): void {
    localStorage.setItem(this.getStorageKey(), sessionId);
    this.ensureSessionInList(sessionId);
  }

  /**
   * Create and switch to a new session
   */
  createNewSession(): string {
    const newSessionId = this.generateSessionId();
    localStorage.setItem(this.getStorageKey(), newSessionId);
    this.ensureSessionInList(newSessionId);
    return newSessionId;
  }

  /**
   * Clear the current session (forces new session on next load)
   */
  clearCurrentSession(): void {
    localStorage.removeItem(this.getStorageKey());
  }

  /**
   * Get all session IDs from localStorage
   */
  getLocalSessionList(): string[] {
    try {
      const raw = localStorage.getItem(this.getSessionsListKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Ensure a session ID is in the list (idempotent)
   */
  private ensureSessionInList(sessionId: string): void {
    const list = this.getLocalSessionList();
    if (!list.includes(sessionId)) {
      localStorage.setItem(
        this.getSessionsListKey(),
        JSON.stringify([sessionId, ...list])
      );
    }
  }

  /**
   * Remove a session ID from the list
   */
  removeFromLocalList(sessionId: string): void {
    const list = this.getLocalSessionList().filter(id => id !== sessionId);
    localStorage.setItem(this.getSessionsListKey(), JSON.stringify(list));
  }

  /**
   * Get all session IDs that should be visible to the user
   * Combines localStorage and database based on authentication status
   */
  async getAllVisibleSessions(): Promise<string[]> {
    const localSessions = this.getLocalSessionList();
    const currentSession = localStorage.getItem(this.getStorageKey());
    
    // Start with local sessions + current session
    const sessionSet = new Set([
      ...localSessions,
      ...(currentSession ? [currentSession] : [])
    ]);

    // If authenticated, also include claimed sessions from database
    if (this.userId) {
      try {
        const { data, error } = await supabase
          .from('user_sessions')
          .select('session_id')
          .eq('user_id', this.userId)
          .eq('chat_instance_id', this.chatInstanceId);

        if (!error && data) {
          data.forEach(row => sessionSet.add(row.session_id));
        }
      } catch (error) {
        console.error('Error fetching user sessions:', error);
      }
    }

    return Array.from(sessionSet);
  }

  /**
   * Migrate all localStorage sessions to the user's account
   * Called automatically on sign-in
   */
  async migrateSessionsToUser(userId: string): Promise<number> {
    try {
      const sessionsToMigrate: Array<{
        chatInstanceId: string;
        sessionId: string;
      }> = [];

      // Scan localStorage for all chat_session:* keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chat_session:')) {
          const chatInstanceId = key.replace('chat_session:', '');
          const sessionId = localStorage.getItem(key);
          
          if (sessionId && chatInstanceId) {
            sessionsToMigrate.push({
              chatInstanceId,
              sessionId,
            });
          }
        }
      }

      if (sessionsToMigrate.length === 0) {
        return 0;
      }

      // Batch insert into user_sessions table
      const records = sessionsToMigrate.map(({ chatInstanceId, sessionId }) => ({
        user_id: userId,
        chat_instance_id: chatInstanceId,
        session_id: sessionId,
      }));

      const { data, error } = await supabase
        .from('user_sessions')
        .upsert(records, {
          onConflict: 'chat_instance_id,session_id',
          ignoreDuplicates: true,
        })
        .select();

      if (error) {
        console.error('Error migrating sessions:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to migrate anonymous sessions:', error);
      return 0;
    }
  }

  /**
   * Delete a session and all its messages
   */
  async deleteSession(sessionId: string): Promise<void> {
    // Delete from database
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)
      .eq('chat_instance_id', this.chatInstanceId);

    if (error) throw error;

    // Remove from local list
    this.removeFromLocalList(sessionId);

    // If deleted current session, clear it
    if (localStorage.getItem(this.getStorageKey()) === sessionId) {
      this.clearCurrentSession();
    }
  }
}

/**
 * Static helper to migrate all sessions for a user (called on sign-in)
 */
export async function migrateAllSessionsForUser(userId: string): Promise<number> {
  const sessionsToMigrate: Array<{
    chatInstanceId: string;
    sessionId: string;
  }> = [];

  // Scan localStorage for all chat_session:* keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('chat_session:')) {
      const chatInstanceId = key.replace('chat_session:', '');
      const sessionId = localStorage.getItem(key);
      
      if (sessionId && chatInstanceId) {
        sessionsToMigrate.push({
          chatInstanceId,
          sessionId,
        });
      }
    }
  }

  if (sessionsToMigrate.length === 0) {
    return 0;
  }

  // Batch insert into user_sessions table
  const records = sessionsToMigrate.map(({ chatInstanceId, sessionId }) => ({
    user_id: userId,
    chat_instance_id: chatInstanceId,
    session_id: sessionId,
  }));

  const { data, error } = await supabase
    .from('user_sessions')
    .upsert(records, {
      onConflict: 'chat_instance_id,session_id',
      ignoreDuplicates: true,
    })
    .select();

  if (error) {
    console.error('Error migrating sessions:', error);
    return 0;
  }

  return data?.length || 0;
}
