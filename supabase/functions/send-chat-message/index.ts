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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, chatInstanceId, metadata }: WebhookPayload = await req.json();

    // Validate input
    if (!message || !sessionId || !chatInstanceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize message (max 10000 chars)
    const sanitizedMessage = message.slice(0, 10000);

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
    if (!chatInstance.webhook_url || !chatInstance.webhook_url.startsWith('https://')) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook URL' }),
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

    console.log(`Calling webhook for chat ${chatInstanceId}:`, chatInstance.webhook_url);

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
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
