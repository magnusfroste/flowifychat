/**
 * Service: Webhook Communication
 * Handles sending messages to webhook and processing responses
 */

import { buildWebhookPayload } from "@/lib/analytics";
import type { MetadataConfig } from "@/types/chatConfiguration";

interface WebhookConfig {
  url: string;
  authEnabled?: boolean;
  username?: string;
  password?: string;
}

interface WebhookPayloadOptions {
  message: string;
  sessionId: string;
  chatInstance: { id: string; slug: string | null };
  metadataConfig: MetadataConfig;
}

export async function sendToWebhook(
  config: WebhookConfig,
  options: WebhookPayloadOptions
): Promise<string> {
  const payload = buildWebhookPayload(
    options.message,
    options.sessionId,
    options.chatInstance,
    options.metadataConfig
  );

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (config.authEnabled && config.username && config.password) {
    const credentials = btoa(`${config.username}:${config.password}`);
    headers["Authorization"] = `Basic ${credentials}`;
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to send message to webhook");
  }

  const text = await response.text();
  let assistantContent = '';

  try {
    const data = JSON.parse(text);
    
    if (data.type === "error") {
      throw new Error(data.content || "Error from webhook");
    }
    
    assistantContent = data.output || data.content || data.response || '';
  } catch (e) {
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        
        if (parsed.type === 'error') {
          throw new Error(parsed.content || 'Error from webhook');
        }
        
        if (parsed.type === 'item' && parsed.content) {
          assistantContent += parsed.content;
        } else if (!parsed.type && (parsed.output || parsed.content || parsed.response)) {
          assistantContent += parsed.output || parsed.content || parsed.response;
        }
      } catch (lineError) {
        console.warn('Skipping invalid JSON line:', line);
      }
    }
  }

  return assistantContent || "I received your message!";
}
