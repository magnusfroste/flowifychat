import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  message: string;
  sessionId: string;
  chatInstanceId: string;
  metadata?: any;
}

// In-memory rate limit store (per edge function instance)
// Note: For production scale, use Redis or database
const ipRateLimits = new Map<string, { count: number; windowStart: number }>();

const IP_RATE_LIMIT = 30; // requests per window
const IP_RATE_WINDOW_MS = 60 * 1000; // 1 minute window

/**
 * Check IP-based rate limit
 * Returns true if request should be allowed, false if rate limited
 */
function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const existing = ipRateLimits.get(ip);

  // Clean up old entries periodically
  if (ipRateLimits.size > 10000) {
    const cutoff = now - IP_RATE_WINDOW_MS;
    for (const [key, value] of ipRateLimits.entries()) {
      if (value.windowStart < cutoff) {
        ipRateLimits.delete(key);
      }
    }
  }

  if (!existing || (now - existing.windowStart) > IP_RATE_WINDOW_MS) {
    // New window
    ipRateLimits.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (existing.count >= IP_RATE_LIMIT) {
    return false;
  }

  // Increment counter
  existing.count++;
  return true;
}

/**
 * Get client IP from request headers
 */
function getClientIp(req: Request): string {
  // Check common headers for real IP (set by proxies/load balancers)
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first (original client)
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }

  // Fallback - may not be accurate behind proxies
  return 'unknown';
}

/**
 * Validate and sanitize message content
 */
function validateMessage(message: string): { valid: boolean; sanitized: string; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, sanitized: '', error: 'Message is required' };
  }

  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'Message cannot be empty' };
  }

  if (trimmed.length > 10000) {
    return { valid: false, sanitized: '', error: 'Message exceeds maximum length of 10,000 characters' };
  }

  // Basic sanitization - remove null bytes and control characters (except newlines/tabs)
  const sanitized = trimmed
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return { valid: true, sanitized };
}

/**
 * Validate webhook URL
 */
function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Webhook URL is required' };
  }

  if (!url.startsWith('https://')) {
    return { valid: false, error: 'Webhook URL must use HTTPS' };
  }

  if (url.length > 2048) {
    return { valid: false, error: 'Webhook URL exceeds maximum length' };
  }

  // Block localhost and internal network URLs
  const urlLower = url.toLowerCase();
  const blockedPatterns = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '192.168.',
    '[::1]',
    'metadata.google',
    '169.254.',
  ];

  for (const pattern of blockedPatterns) {
    if (urlLower.includes(pattern)) {
      return { valid: false, error: 'Invalid webhook URL' };
    }
  }

  return { valid: true };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // IP-based rate limiting
    const clientIp = getClientIp(req);
    if (!checkIpRateLimit(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }

    const { message, sessionId, chatInstanceId, metadata }: WebhookPayload = await req.json();

    // Validate required fields
    if (!sessionId || !chatInstanceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize message
    const messageValidation = validateMessage(message);
    if (!messageValidation.valid) {
      return new Response(
        JSON.stringify({ error: messageValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedMessage = messageValidation.sanitized;

    // Initialize Supabase client with service role key (has access to all data)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch full chat instance (including credentials) - service role bypasses RLS
    const { data: chatInstance, error: fetchError } = await supabaseClient
      .from('chat_instances')
      .select('id, slug, webhook_url, n8n_auth_enabled, n8n_auth_username, n8n_auth_password, custom_branding')
      .eq('id', chatInstanceId)
      .single();

    if (fetchError || !chatInstance) {
      console.error('Error fetching chat instance:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Chat instance not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate webhook URL
    const webhookValidation = validateWebhookUrl(chatInstance.webhook_url);
    if (!webhookValidation.valid) {
      console.error('Invalid webhook URL:', webhookValidation.error);
      return new Response(
        JSON.stringify({ error: webhookValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build webhook payload in n8n Chat Trigger compatible format
    const webhookPayload = {
      chatInput: sanitizedMessage,        // n8n expects 'chatInput' not 'message'
      sessionId: sessionId,                // This matches n8n's session field
      action: 'sendMessage',               // Standard n8n chat action
      // Additional data for custom workflows
      chatInstanceId: chatInstance.id,
      slug: chatInstance.slug,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
      // Legacy support (in case some workflows still use 'message')
      message: sanitizedMessage
    };

    // Prepare headers
    const webhookHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add basic auth if enabled
    if (chatInstance.n8n_auth_enabled && chatInstance.n8n_auth_username && chatInstance.n8n_auth_password) {
      const credentials = btoa(`${chatInstance.n8n_auth_username}:${chatInstance.n8n_auth_password}`);
      webhookHeaders['Authorization'] = `Basic ${credentials}`;
    }

    // Make webhook call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

    console.log(`Calling webhook for chat ${chatInstanceId} from IP ${clientIp}`);

    const response = await fetch(chatInstance.webhook_url, {
      method: 'POST',
      headers: webhookHeaders,
      body: JSON.stringify(webhookPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Webhook returned status ${response.status}`);
      return new Response(
        JSON.stringify({ error: 'Webhook request failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse webhook response
    const text = await response.text();
    let assistantContent = '';

    try {
      const data = JSON.parse(text);
      
      if (data.type === 'error') {
        throw new Error(data.content || 'Error from webhook');
      }
      
      assistantContent = data.output || data.content || data.response || '';
    } catch (e) {
      // Try parsing as newline-delimited JSON
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

    console.log(`Webhook call successful, response length: ${assistantContent.length}`);

    return new Response(
      JSON.stringify({ 
        content: assistantContent || 'I received your message!',
        success: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-chat-message:', error);
    
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'Request timeout - webhook took too long to respond' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
