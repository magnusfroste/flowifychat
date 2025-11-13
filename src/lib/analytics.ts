import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEventType = "view" | "message_sent" | "message_received";

export interface AnalyticsEvent {
  chat_instance_id: string;
  session_id: string;
  event_type: AnalyticsEventType;
  metadata?: Record<string, any>;
}

/**
 * Track an analytics event for a chat instance
 */
export const trackAnalyticsEvent = async (event: AnalyticsEvent) => {
  try {
    const { error } = await supabase
      .from("chat_analytics")
      .insert({
        chat_instance_id: event.chat_instance_id,
        session_id: event.session_id,
        event_type: event.event_type,
        metadata: event.metadata || {},
      });

    if (error) {
      console.error("Analytics tracking error:", error);
    }
  } catch (error) {
    console.error("Failed to track analytics:", error);
  }
};

/**
 * Build enhanced webhook payload with metadata
 */
export const buildWebhookPayload = (
  message: string,
  sessionId: string,
  chatInstance: { id: string; slug: string | null },
  metadataConfig: {
    includeReferrer: boolean;
    includeUserAgent: boolean;
    customFields: Record<string, string>;
  }
) => {
  const basePayload = {
    action: "sendMessage",
    sessionId: sessionId,
    chatInput: message,
  };

  const enhancedMetadata: Record<string, any> = {};

  if (metadataConfig.includeReferrer) {
    enhancedMetadata.referrer = document.referrer || "direct";
  }

  if (metadataConfig.includeUserAgent) {
    enhancedMetadata.userAgent = navigator.userAgent;
  }

  // Add custom fields
  Object.assign(enhancedMetadata, metadataConfig.customFields);

  // Add chat context
  enhancedMetadata.chatSlug = chatInstance.slug;
  enhancedMetadata.chatId = chatInstance.id;

  return {
    ...basePayload,
    metadata: enhancedMetadata,
  };
};

/**
 * Get count of signed-up users for a chat instance
 */
export const getChatUserCount = async (chatInstanceId: string) => {
  try {
    const { count, error } = await supabase
      .from("user_sessions")
      .select("*", { count: 'exact', head: true })
      .eq("chat_instance_id", chatInstanceId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Failed to fetch user count:", error);
    return 0;
  }
};

/**
 * Get analytics summary for a chat instance
 */
export const getChatAnalytics = async (chatInstanceId: string) => {
  try {
    const { data, error } = await supabase
      .from("chat_analytics_summary")
      .select("*")
      .eq("chat_instance_id", chatInstanceId)
      .single();

    if (error) {
      // Return default values if no analytics exist yet
      if (error.code === "PGRST116") {
        return {
          total_views: 0,
          unique_views: 0,
          total_messages: 0,
          active_sessions: 0,
          last_activity: null,
        };
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return {
      total_views: 0,
      unique_views: 0,
      total_messages: 0,
      active_sessions: 0,
      last_activity: null,
    };
  }
};
