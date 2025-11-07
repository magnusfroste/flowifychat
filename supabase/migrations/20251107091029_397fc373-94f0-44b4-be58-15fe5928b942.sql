-- Insert demo chat instance with slug 'demo' using an existing user
INSERT INTO public.chat_instances (
  id,
  user_id,
  name,
  slug,
  webhook_url,
  is_active,
  custom_branding
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM auth.users LIMIT 1), -- Use first available user
  'Flowify Demo Chat',
  'demo',
  'https://demo.flowify.chat/webhook',
  true,
  '{
    "primaryColor": "#6366F1",
    "accentColor": "#8B5CF6",
    "fontFamily": "Inter",
    "borderRadius": 12,
    "avatarUrl": null,
    "logoUrl": null,
    "chatTitle": "Flowify Demo",
    "welcomeMessage": "Welcome to Flowify! Try asking me about n8n workflows, automation ideas, or how to build beautiful chat interfaces.",
    "tagline": "Experience the power of beautiful chat interfaces",
    "backgroundStyle": "gradient",
    "backgroundColor": "#F8F9FF",
    "inputPlaceholder": "Ask me anything about n8n and automation...",
    "inputButtonStyle": "rounded",
    "quickStartPrompts": [
      "What is Flowify?",
      "How do I connect my n8n workflow?",
      "Show me customization options",
      "Can I embed this chat?"
    ],
    "welcomeScreen": {
      "enabled": false
    },
    "inputConfig": {
      "maxLength": 2000,
      "showCharacterCount": false,
      "submitOnEnter": true
    },
    "uxConfig": {
      "showTimestamps": false,
      "enableMarkdown": true,
      "messageDensity": "comfortable"
    },
    "layoutConfig": {
      "messageAlignment": "alternating",
      "maxWidth": "standard"
    }
  }'
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  webhook_url = EXCLUDED.webhook_url,
  is_active = EXCLUDED.is_active,
  custom_branding = EXCLUDED.custom_branding;