/**
 * Public Chat Component
 * Lightweight chat with optional localStorage-based history
 * NO database storage, GDPR-compliant
 */

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendToWebhookViaEdge } from "@/lib/edgeWebhookService";
import { trackPublicAnalyticsEvent } from "@/lib/analytics";
import { getMetadataConfig, getQuickStartPromptsConfig, getInputConfig, getUXConfig, getLayoutConfig } from "@/lib/chatConfig";
import { ChatLandingPage } from "@/components/ChatLandingPage";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatInput } from "@/components/ChatInput";
import { MessageList } from "@/components/MessageList";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatThemeProvider } from "@/theme/ChatThemeProvider";
import { PublicChatSidebar, saveLocalSession, getLocalSessions } from "@/components/PublicChatSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
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

// localStorage key for storing messages per session
const getMessagesKey = (chatInstanceId: string, sessionId: string) =>
  `flowify_messages_${chatInstanceId}_${sessionId}`;

export function PublicChat({ chatInstance }: PublicChatProps) {
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatMode, setChatMode] = useState<'landing' | 'chat'>('landing');
  const [isTypingPrompt, setIsTypingPrompt] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
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
    showMessageActions: false,
    showCopyButton: false,
    showRegenerateButton: false,
  };
  const inputStyle = branding?.inputStyle || 'outline';
  const buttonStyle = branding?.buttonStyle || 'filled';
  const inputSize = branding?.inputSize || 'comfortable';
  const primaryColor = branding?.primaryColor || '#6366f1';

  // Determine if sidebar should be shown
  const showSidebar = layoutConfig.showSidebar && layoutConfig.allowAnonymousHistory;

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

  // Track page view (GDPR-safe: no personal data)
  useEffect(() => {
    if (!viewTracked) {
      trackPublicAnalyticsEvent(chatInstance.id, sessionId, "view");
      setViewTracked(true);
    }
  }, [chatInstance.id, sessionId, viewTracked]);

  // Load messages from localStorage when session changes
  useEffect(() => {
    if (showSidebar) {
      try {
        const stored = localStorage.getItem(getMessagesKey(chatInstance.id, sessionId));
        if (stored) {
          const parsed = JSON.parse(stored);
          setMessages(parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })));
          if (parsed.length > 0) {
            setChatMode('chat');
          }
        } else {
          setMessages([]);
          setChatMode('landing');
        }
      } catch {
        setMessages([]);
      }
    }
  }, [sessionId, chatInstance.id, showSidebar]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (showSidebar && messages.length > 0) {
      localStorage.setItem(
        getMessagesKey(chatInstance.id, sessionId),
        JSON.stringify(messages)
      );
      
      // Update session in sidebar
      const firstUserMessage = messages.find(m => m.role === 'user');
      saveLocalSession(
        chatInstance.id,
        sessionId,
        firstUserMessage?.content.substring(0, 50) || 'New conversation',
        messages.length
      );
      
      // Trigger sidebar refresh
      window.dispatchEvent(new CustomEvent(`refresh_public_sidebar_${chatInstance.id}`));
    }
  }, [messages, sessionId, chatInstance.id, showSidebar]);

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

  const handleNewSession = () => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setMessages([]);
    setChatMode('landing');
  };

  const handleSessionSelect = (selectedSessionId: string) => {
    setSessionId(selectedSessionId);
  };

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

    // Track message sent (GDPR-safe: only message length, no content)
    trackPublicAnalyticsEvent(
      chatInstance.id,
      sessionId,
      "message_sent",
      { message_length: userMessage.content.length }
    );

    if (chatMode === 'landing') {
      setChatMode('chat');
    }

    try {
      const metadataConfig = getMetadataConfig(branding);
      
      const assistantContent = await sendToWebhookViaEdge({
        message: userMessage.content,
        sessionId: sessionId,
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

      // Track message received (GDPR-safe: only response length)
      trackPublicAnalyticsEvent(
        chatInstance.id,
        sessionId,
        "message_received",
        { response_length: assistantContent.length }
      );
    } catch (error) {
      console.error("Error sending message:", error);
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

  // Content wrapper - adjusts based on sidebar
  const ContentWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  );

  // Landing page mode
  if (chatMode === 'landing' && uxConfig.useLandingPageMode) {
    if (showSidebar) {
      return (
        <ChatThemeProvider branding={themeBranding}>
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full" style={bgStyles}>
              <PublicChatSidebar
                chatInstanceId={chatInstance.id}
                currentSessionId={sessionId}
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
                logoUrl={branding?.logoUrl}
                avatarUrl={branding?.avatarUrl}
                chatTitle={branding?.chatTitle}
              />
              <ContentWrapper>
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
              </ContentWrapper>
            </div>
          </SidebarProvider>
        </ChatThemeProvider>
      );
    }

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

  // Chat mode with sidebar
  if (showSidebar) {
    return (
      <ChatThemeProvider branding={themeBranding}>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full" style={bgStyles}>
            <PublicChatSidebar
              chatInstanceId={chatInstance.id}
              currentSessionId={sessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              logoUrl={branding?.logoUrl}
              avatarUrl={branding?.avatarUrl}
              chatTitle={branding?.chatTitle}
            />
            <ContentWrapper>
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
            </ContentWrapper>
          </div>
        </SidebarProvider>
      </ChatThemeProvider>
    );
  }

  // Chat mode without sidebar
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