/**
 * Public Chat Component
 * Lightweight, stateless chat that sends directly to webhook
 * NO database storage, NO session management, GDPR-compliant
 */

import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendToWebhookViaEdge } from "@/lib/edgeWebhookService";
import { getMetadataConfig, getQuickStartPromptsConfig, getInputConfig, getUXConfig, getLayoutConfig } from "@/lib/chatConfig";
import { ChatLandingPage } from "@/components/ChatLandingPage";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatInput } from "@/components/ChatInput";
import { MessageList } from "@/components/MessageList";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatThemeProvider } from "@/theme/ChatThemeProvider";
import type { ChatBranding } from "@/types/chatConfiguration";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInstance {
  id: string;
  name: string;
  slug: string | null;
  webhook_url: string;
  user_id: string;
  n8n_auth_enabled?: boolean;
  n8n_auth_username?: string;
  n8n_auth_password?: string;
  custom_branding: any;
}

interface PublicChatProps {
  chatInstance: ChatInstance;
}

export function PublicChat({ chatInstance }: PublicChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatMode, setChatMode] = useState<'landing' | 'chat'>('landing');
  const [isTypingPrompt, setIsTypingPrompt] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const branding = chatInstance.custom_branding;
  const uxConfig = getUXConfig(branding);
  const quickStartConfig = getQuickStartPromptsConfig(branding);
  const inputConfig = getInputConfig(branding);
  const layoutConfig = getLayoutConfig(branding);
  const behaviorConfig = {
    messageSpacing: branding?.messageSpacing || 'normal',
  };
  const interactiveConfig = {
    showMessageActions: false, // No actions in public mode
    showCopyButton: false,
    showRegenerateButton: false,
  };
  const inputStyle = branding?.inputStyle || 'outline';
  const buttonStyle = branding?.buttonStyle || 'filled';
  const inputSize = branding?.inputSize || 'comfortable';
  const primaryColor = branding?.primaryColor || '#6366f1';

  // Check if current user is the owner
  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setIsOwner(session.user.id === chatInstance.user_id);
      }
    };
    checkOwnership();
  }, [chatInstance.user_id]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup typing animation
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const typeAndSend = async (text: string) => {
    setIsTypingPrompt(true);
    setInput("");
    
    for (let i = 0; i <= text.length; i++) {
      await new Promise(resolve => {
        typingTimeoutRef.current = setTimeout(resolve, 30);
      });
      setInput(text.slice(0, i));
    }
    
    await new Promise(resolve => {
      typingTimeoutRef.current = setTimeout(resolve, 200);
    });
    
    setIsTypingPrompt(false);
    handleSend(text);
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    // Transition to chat mode after first message
    if (chatMode === 'landing') {
      setChatMode('chat');
    }

    try {
      const metadataConfig = getMetadataConfig(branding);
      
      const assistantContent = await sendToWebhookViaEdge({
        message: userMessage.content,
        sessionId: 'public',
        chatInstanceId: chatInstance.id,
        metadataConfig,
      });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message to chat
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const bgStyles = branding?.backgroundStyle === 'gradient' && branding?.backgroundGradientStart && branding?.backgroundGradientEnd
    ? { background: `linear-gradient(135deg, ${branding.backgroundGradientStart}, ${branding.backgroundGradientEnd})` }
    : branding?.backgroundColor ? { backgroundColor: branding.backgroundColor } : {};

  // Build a ChatBranding object for theming
  const themeBranding: ChatBranding = {
    chatTitle: branding?.chatTitle || chatInstance.name,
    welcomeMessage: branding?.welcomeMessage || '',
    primaryColor: branding?.primaryColor || '#6366f1',
    accentColor: branding?.accentColor,
    secondaryColor: branding?.secondaryColor,
    userMessageColor: branding?.userMessageColor,
    botMessageColor: branding?.botMessageColor,
    backgroundColor: branding?.backgroundColor,
    backgroundStyle: branding?.backgroundStyle,
    textColor: branding?.textColor,
    fontFamily: branding?.fontFamily,
    fontWeight: branding?.fontWeight,
    lineHeight: branding?.lineHeight,
    avatarUrl: branding?.avatarUrl,
  };

  // Landing page mode
  if (chatMode === 'landing' && uxConfig.useLandingPageMode) {
    return (
      <ChatThemeProvider branding={themeBranding}>
        <div 
          className="min-h-screen flex flex-col text-foreground"
          style={bgStyles}
        >
          <ChatHeader
            isOwner={isOwner}
            chatTitle={chatInstance.name}
            displayTitle={branding?.chatTitle}
            headerStyle={layoutConfig.headerStyle}
            showTitle={false}
            transparent={true}
            user={user}
            useLandingPageMode={uxConfig.useLandingPageMode}
          />
          
          <div className="flex-1">
            <ChatLandingPage
              branding={branding}
              quickStartPrompts={quickStartConfig.prompts}
              inputPlaceholder={inputConfig.placeholder}
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              onPromptClick={(text) => {
                if (quickStartConfig.autoSend) {
                  typeAndSend(text);
                } else {
                  setInput(text);
                }
              }}
              sending={sending}
              autoSend={quickStartConfig.autoSend}
              isTypingPrompt={isTypingPrompt}
            />
          </div>
        </div>
      </ChatThemeProvider>
    );
  }

  // Chat mode - centered window, no sidebar
  return (
    <ChatThemeProvider branding={themeBranding}>
      <div 
        className="min-h-screen flex flex-col text-foreground"
        style={bgStyles}
      >
        <ChatHeader
          isOwner={isOwner}
          chatTitle={chatInstance.name}
          displayTitle={branding?.chatTitle}
          headerStyle={layoutConfig.headerStyle}
          showTitle={true}
          transparent={false}
          user={user}
          useLandingPageMode={uxConfig.useLandingPageMode}
        />

        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
          <div className="flex-1 overflow-y-auto mb-4">
            <MessageList
              messages={messages}
              branding={branding}
              layoutConfig={layoutConfig}
              behaviorConfig={behaviorConfig}
              interactiveConfig={interactiveConfig}
              copiedMessageId={null}
              copiedCodeBlock={null}
              onCopyMessage={() => {}}
              onCopyCode={() => {}}
              onRegenerate={() => {}}
              sending={sending}
            />
            {sending && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="sticky bottom-0 pt-4 bg-background/80 backdrop-blur-sm">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => handleSend()}
              sending={sending || isTypingPrompt}
              placeholder={inputConfig.placeholder}
              inputStyle={inputStyle as any}
              buttonStyle={buttonStyle as any}
              inputSize={inputSize === 'compact' ? 'compact' : inputSize === 'large' ? 'large' : 'standard'}
              primaryColor={primaryColor}
            />
          </div>
        </main>
      </div>
    </ChatThemeProvider>
  );
}