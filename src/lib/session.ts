/**
 * Legacy session utilities - kept for backward compatibility
 * New code should use SessionManager class instead
 */

const SESSION_PREFIX = "chat_session:";

/**
 * Get the storage key for a chat's session
 */
const getStorageKey = (chatKey: string): string => {
  return `${SESSION_PREFIX}${chatKey}`;
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get existing sessionId for a chat or create a new one
 * @deprecated Use SessionManager.getOrCreateSession() instead
 */
export const getOrCreateSessionId = (chatKey: string): string => {
  const key = getStorageKey(chatKey);
  const existing = localStorage.getItem(key);
  
  if (existing) {
    return existing;
  }
  
  const newSessionId = generateSessionId();
  localStorage.setItem(key, newSessionId);
  return newSessionId;
};

/**
 * Clear the sessionId for a chat
 * @deprecated Use SessionManager.clearCurrentSession() instead
 */
export const clearSessionId = (chatKey: string): void => {
  const key = getStorageKey(chatKey);
  localStorage.removeItem(key);
};
