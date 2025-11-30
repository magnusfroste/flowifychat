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

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors, timeouts, and 5xx errors are retryable
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || "";
  const retryablePatterns = [
    "network",
    "timeout",
    "econnreset",
    "fetch failed",
    "failed to fetch",
    "503",
    "502",
    "504",
  ];
  
  return retryablePatterns.some((pattern) => message.includes(pattern));
}

export async function sendToWebhookViaEdge(
  options: EdgeWebhookOptions,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
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
        throw new Error(error.message || 'Failed to send message via edge function');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Unknown error from edge function');
      }

      return data.content;
    } catch (error: any) {
      lastError = error;

      // Log attempt for debugging
      if (import.meta.env.DEV) {
        console.warn(`Edge function attempt ${attempt + 1} failed:`, error.message);
      }

      // Check if we should retry
      if (attempt < retryConfig.maxRetries && isRetryableError(error)) {
        const delay = getBackoffDelay(attempt, retryConfig);
        if (import.meta.env.DEV) {
          console.log(`Retrying in ${delay}ms...`);
        }
        await sleep(delay);
        continue;
      }

      // Non-retryable error or max retries reached
      break;
    }
  }

  // All retries exhausted
  throw lastError || new Error("Failed to send message after retries");
}
