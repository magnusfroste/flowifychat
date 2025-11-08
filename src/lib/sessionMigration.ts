import { supabase } from "@/integrations/supabase/client";

/**
 * Scans localStorage for all chat sessions and migrates them to the user's account
 */
export const migrateAnonymousSessions = async (userId: string): Promise<number> => {
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
};

/**
 * Get all session IDs claimed by a user for a specific chat instance
 */
export const getUserSessionIds = async (
  userId: string,
  chatInstanceId: string
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('session_id')
      .eq('user_id', userId)
      .eq('chat_instance_id', chatInstanceId);

    if (error) throw error;

    return data?.map(row => row.session_id) || [];
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }
};
