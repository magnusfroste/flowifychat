import { useState, useEffect, useMemo } from "react";
import { SessionManager } from "@/lib/SessionManager";

/**
 * React hook for session management
 * Provides a SessionManager instance and reactive session state
 */
export function useSessionManager(chatInstanceId: string, userId: string | null = null) {
  const sessionManager = useMemo(
    () => new SessionManager(chatInstanceId, userId),
    [chatInstanceId, userId]
  );

  const [currentSessionId, setCurrentSessionId] = useState<string>(() =>
    sessionManager.getOrCreateSession()
  );

  // Update session manager when userId changes
  useEffect(() => {
    const manager = new SessionManager(chatInstanceId, userId);
    setCurrentSessionId(manager.getOrCreateSession());
  }, [chatInstanceId, userId]);

  const switchSession = (sessionId: string) => {
    sessionManager.switchSession(sessionId);
    setCurrentSessionId(sessionId);
  };

  const createNewSession = () => {
    const newSessionId = sessionManager.createNewSession();
    setCurrentSessionId(newSessionId);
    return newSessionId;
  };

  const clearSession = () => {
    sessionManager.clearCurrentSession();
    const newSessionId = sessionManager.getOrCreateSession();
    setCurrentSessionId(newSessionId);
    return newSessionId;
  };

  return {
    sessionManager,
    currentSessionId,
    switchSession,
    createNewSession,
    clearSession,
  };
}
