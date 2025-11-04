/**
 * Session management utilities for chat instances
 * Persists sessionId per chat to maintain n8n memory across page reloads
 */

const SESSION_PREFIX = "chat_session:";

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get the storage key for a chat's session
 */
const getStorageKey = (chatKey: string): string => {
  return `${SESSION_PREFIX}${chatKey}`;
};

/**
 * Derive a chat key from route ID or instance ID
 * Prefers instance UUID (canonical) over route parameter
 */
export const getChatKeyFromRouteOrInstance = (
  routeId?: string,
  instanceId?: string
): string => {
  return instanceId || routeId || "unknown";
};

/**
 * Get existing sessionId for a chat or create a new one
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
 * Clear the sessionId for a chat (forces new session on next load)
 */
export const clearSessionId = (chatKey: string): void => {
  const key = getStorageKey(chatKey);
  localStorage.removeItem(key);
};

/**
 * Migrate sessionId from one key to another (used when route key != instance UUID)
 */
export const migrateSessionId = (oldKey: string, newKey: string): void => {
  const oldStorageKey = getStorageKey(oldKey);
  const newStorageKey = getStorageKey(newKey);
  
  const value = localStorage.getItem(oldStorageKey);
  if (value && oldKey !== newKey) {
    localStorage.setItem(newStorageKey, value);
    localStorage.removeItem(oldStorageKey);
  }
};
