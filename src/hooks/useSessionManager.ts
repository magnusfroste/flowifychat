import { useEffect, useState, useRef, useCallback } from "react";
import { SessionManager } from "@/lib/SessionManager";

/**
 * React hook for session management
 * Provides a SessionManager instance and reactive session state
 */
export function useSessionManager(chatInstanceId: string, userId: string) {
  const [sessionManager] = useState(() => new SessionManager(chatInstanceId, userId));
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const isMountedRef = useRef(true);

  // Initialize session on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    const initSession = async () => {
      const sessionId = await sessionManager.getOrCreateSession();
      if (isMountedRef.current) {
        setCurrentSessionId(sessionId);
      }
    };
    initSession();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [sessionManager]);

  const switchSession = useCallback((sessionId: string) => {
    sessionManager.switchSession(sessionId);
    if (isMountedRef.current) {
      setCurrentSessionId(sessionId);
    }
  }, [sessionManager]);

  const createNewSession = useCallback(async () => {
    const newSessionId = await sessionManager.createNewSession();
    if (isMountedRef.current) {
      setCurrentSessionId(newSessionId);
    }
    return newSessionId;
  }, [sessionManager]);

  const deleteSession = useCallback(async (sessionId: string) => {
    await sessionManager.deleteSession(sessionId);
    // Create new session if deleted current one
    if (sessionId === currentSessionId && isMountedRef.current) {
      const newSessionId = await sessionManager.createNewSession();
      if (isMountedRef.current) {
        setCurrentSessionId(newSessionId);
      }
      return newSessionId;
    }
  }, [sessionManager, currentSessionId]);

  return {
    sessionManager,
    currentSessionId,
    switchSession,
    createNewSession,
    deleteSession,
  };
}
