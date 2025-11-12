import { useEffect, useState } from "react";
import { SessionManager } from "@/lib/SessionManager";

/**
 * React hook for session management
 * Provides a SessionManager instance and reactive session state
 */
export function useSessionManager(chatInstanceId: string, userId: string) {
  const [sessionManager] = useState(() => new SessionManager(chatInstanceId, userId));
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      const sessionId = await sessionManager.getOrCreateSession();
      setCurrentSessionId(sessionId);
    };
    initSession();
  }, [sessionManager]);

  const switchSession = (sessionId: string) => {
    sessionManager.switchSession(sessionId);
    setCurrentSessionId(sessionId);
  };

  const createNewSession = async () => {
    const newSessionId = await sessionManager.createNewSession();
    setCurrentSessionId(newSessionId);
    return newSessionId;
  };

  const deleteSession = async (sessionId: string) => {
    await sessionManager.deleteSession(sessionId);
    // Create new session if deleted current one
    if (sessionId === currentSessionId) {
      const newSessionId = await sessionManager.createNewSession();
      setCurrentSessionId(newSessionId);
      return newSessionId;
    }
  };

  return {
    sessionManager,
    currentSessionId,
    switchSession,
    createNewSession,
    deleteSession,
  };
}
