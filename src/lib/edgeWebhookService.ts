/**
 * Edge Webhook Service
 * Secure webhook communication via edge function proxy
 * Credentials never exposed to client-side code
 */

import { supabase } from "@/integrations/supabase/client";
import type { MetadataConfig } from "@/types/chatConfiguration";

interface EdgeWebhookOptions {
  message: string;
  sessionId: string;
  chatInstanceId: string;
  metadataConfig: MetadataConfig;
}

export async function sendToWebhookViaEdge(
  options: EdgeWebhookOptions
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('send-chat-message', {
      body: {
        message: options.message,
        sessionId: options.sessionId,
        chatInstanceId: options.chatInstanceId,
        metadata: options.metadataConfig,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to send message via edge function');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Unknown error from edge function');
    }

    return data.content;
  } catch (error: any) {
    console.error('Error calling edge function:', error);
    throw error;
  }
}
