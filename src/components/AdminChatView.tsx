/**
 * AdminChatView - Embedded chat interface for the admin layout.
 * Renders the full chat experience without its own header/sidebar,
 * relying on AdminLayout's top header and sidebar instead.
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowDown } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { sendToWebhookViaEdge } from "@/lib/edgeWebhookService";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { ChatLandingPage } from "@/components/ChatLandingPage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { SessionManager } from "@/lib/SessionManager";
import {
  getQuickStartPromptsConfig,
  getWelcomeScreen,
  getInputConfig,
  getMetadataConfig,
  getUXConfig,
  getLayoutConfig,
  getMessageBehaviorConfig,
  getInteractiveConfig,
} from "@/lib/chatConfig";
import type { AdminChatInstance } from "@/types/adminLayout";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AdminChatViewProps {
  chatInstance: AdminChatInstance;
  user: any;
  /** Externally controlled session ID from AdminLayout */
  externalSessionId?: string;
  /** Callback to report the active session back to parent */
  onSessionIdChange?: (sessionId: string) => void;
}

export function AdminChatView({ chatInstance, user, externalSessionId, onSessionIdChange }: AdminChatViewProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatMode, setChatMode] = useState<'landing' | 'welcome' | 'chat'>('landing');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedCodeBlock, setCopiedCodeBlock] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isTypingPrompt, setIsTypingPrompt] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external session ID
  useEffect(() => {
    if (externalSessionId && externalSessionId !== sessionId) {
      setSessionId(externalSessionId);
    }
  }, [externalSessionId]);

  // Initialize session
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      if (!chatInstance || !user) return;

      // If we already have an external session, use it
      if (externalSessionId) {
        if (isMounted) {
          setSessionId(externalSessionId);
          setLoading(false);
        }
        return;
      }

      try {
        const manager = new SessionManager(chatInstance.id, user.id);
        const activeSessionId = await manager.getLatestSession() || await manager.createNewSession();
        if (isMounted) {
          setSessionId(activeSessionId);
          onSessionIdChange?.(activeSessionId);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error initializing session:", error);
        if (isMounted) setLoading(false);
      }
    };

    setLoading(true);
    setMessages([]);
    setSessionId("");
    setChatMode('landing');
    initSession();

    return () => { isMounted = false; };
  }, [chatInstance.id, user?.id, externalSessionId]);

  // Load messages
  useEffect(() => {
    let isMounted = true;
    if (!sessionId || !chatInstance) return;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("chat_instance_id", chatInstance.id)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (!isMounted || error) return;

        if (data && data.length > 0) {
          setMessages(data.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.created_at),
          })));
        } else {
          const branding = chatInstance.custom_branding;
          const uxConfig = getUXConfig(branding);
          if (!uxConfig.useLandingPageMode) {
            const welcomeMsg: Message = {
              id: "welcome",
              role: "assistant",
              content: branding?.welcomeMessage || "Hi! How can I help you today?",
              timestamp: new Date(),
            };
            setMessages([welcomeMsg]);
            await supabase.from("chat_messages").insert({
              chat_instance_id: chatInstance.id,
              session_id: sessionId,
              role: "assistant",
              content: welcomeMsg.content,
            });
          }
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
    return () => { isMounted = false; };
  }, [chatInstance?.id, sessionId]);

  // Chat mode based on messages
  useEffect(() => {
    if (!chatInstance) return;
    const branding = chatInstance.custom_branding;
    const uxConfig = getUXConfig(branding);
    const welcomeScreenConfig = getWelcomeScreen(branding);

    if (uxConfig.useLandingPageMode) {
      setChatMode(messages.length === 0 ? 'landing' : 'chat');
    } else if (messages.length <= 1) {
      setChatMode(welcomeScreenConfig.enabled ? 'welcome' : 'chat');
    } else {
      setChatMode('chat');
    }
  }, [chatInstance, messages.length]);

  // Auto-scroll
  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollButton]);

  // Scroll detection
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 200);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const typeAndSend = async (text: string) => {
    setIsTypingPrompt(true);
    setInput("");
    for (let i = 0; i <= text.length; i++) {
      await new Promise<void>(resolve => {
        typingTimeoutRef.current = setTimeout(() => { setInput(text.slice(0, i)); resolve(); }, 30);
      });
    }
    await new Promise<void>(resolve => { typingTimeoutRef.current = setTimeout(resolve, 200); });
    setIsTypingPrompt(false);
    handleSend(text);
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || !chatInstance) return;

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const manager = new SessionManager(chatInstance.id, user.id);
      activeSessionId = await manager.createNewSession();
      setSessionId(activeSessionId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      await supabase.from("chat_messages").insert({
        chat_instance_id: chatInstance.id,
        session_id: activeSessionId,
        role: "user",
        content: userMessage.content,
      });
    } catch (error) {
      console.error("Error saving user message:", error);
    }

    if (chatMode === 'landing' || chatMode === 'welcome') setChatMode('chat');

    await trackAnalyticsEvent({
      chat_instance_id: chatInstance.id,
      session_id: activeSessionId,
      event_type: "message_sent",
      metadata: { message_length: userMessage.content.length },
    });

    try {
      const branding = chatInstance.custom_branding;
      const metadataConfig = getMetadataConfig(branding);

      const assistantContent = await sendToWebhookViaEdge({
        message: userMessage.content,
        sessionId: activeSessionId,
        chatInstanceId: chatInstance.id,
        metadataConfig,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      await supabase.from("chat_messages").insert({
        chat_instance_id: chatInstance.id,
        session_id: activeSessionId,
        role: "assistant",
        content: assistantMessage.content,
      });

      await trackAnalyticsEvent({
        chat_instance_id: chatInstance.id,
        session_id: activeSessionId,
        event_type: "message_received",
        metadata: { response_length: assistantContent.length },
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please check your webhook URL.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleCopyCode = async (code: string, blockId: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCodeBlock(blockId);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedCodeBlock(null), 2000);
  };

  const handleRegenerate = async () => {
    if (!chatInstance || !sessionId || messages.length < 2) return;

    let lastAssistantIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") { lastAssistantIndex = i; break; }
    }
    if (lastAssistantIndex === -1) return;

    const userMessage = messages.slice(0, lastAssistantIndex).reverse().find(m => m.role === "user");
    if (!userMessage) return;

    const originalMessages = [...messages];
    const oldAssistantId = messages[lastAssistantIndex]?.id;

    setMessages(prev => prev.slice(0, lastAssistantIndex));
    setSending(true);

    try {
      const branding = chatInstance.custom_branding;
      const metadataConfig = getMetadataConfig(branding);
      const assistantContent = await sendToWebhookViaEdge({
        message: userMessage.content,
        sessionId,
        chatInstanceId: chatInstance.id,
        metadataConfig,
      });

      const newMsg: Message = { id: Date.now().toString(), role: "assistant", content: assistantContent, timestamp: new Date() };
      setMessages(prev => [...prev, newMsg]);

      if (oldAssistantId) {
        await supabase.from("chat_messages").delete().eq("id", oldAssistantId);
      }
      await supabase.from("chat_messages").insert({
        chat_instance_id: chatInstance.id,
        session_id: sessionId,
        role: "assistant",
        content: assistantContent,
      });
    } catch (error) {
      console.error("Error regenerating:", error);
      setMessages(originalMessages);
      toast({ title: "Error", description: "Failed to regenerate response.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleNewSession = async () => {
    if (!chatInstance || !user) return;
    const manager = new SessionManager(chatInstance.id, user.id);
    const newSessionId = await manager.createNewSession();
    setSessionId(newSessionId);

    const branding = chatInstance.custom_branding;
    const uxConfig = getUXConfig(branding);

    if (!uxConfig.useLandingPageMode) {
      const welcomeMsg: Message = {
        id: "welcome",
        role: "assistant",
        content: branding?.welcomeMessage || "Hi! How can I help you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
      await supabase.from("chat_messages").insert({
        chat_instance_id: chatInstance.id,
        session_id: newSessionId,
        role: "assistant",
        content: welcomeMsg.content,
      });
    } else {
      setMessages([]);
    }

    const welcomeScreenConfig = getWelcomeScreen(branding);
    if (uxConfig.useLandingPageMode) setChatMode('landing');
    else if (welcomeScreenConfig.enabled) setChatMode('welcome');
    else setChatMode('chat');

    toast({ title: "New conversation", description: "Started a new session" });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const branding = chatInstance.custom_branding;
  const quickStartConfig = getQuickStartPromptsConfig(branding);
  const welcomeScreenConfig = getWelcomeScreen(branding);
  const inputConfig = getInputConfig(branding);
  const layoutConfig = getLayoutConfig(branding);
  const behaviorConfig = getMessageBehaviorConfig(branding);
  const interactiveConfig = getInteractiveConfig(branding);
  const uxConfig = getUXConfig(branding);

  const fontFamily = branding?.fontFamily || 'Inter';
  const inputStyle = branding?.inputStyle || 'outline';
  const buttonStyle = branding?.buttonStyle || 'filled';

  const bgStyles = branding?.backgroundStyle === 'gradient' && branding?.backgroundGradientStart && branding?.backgroundGradientEnd
    ? { background: `linear-gradient(135deg, ${branding.backgroundGradientStart}, ${branding.backgroundGradientEnd})` }
    : branding?.backgroundColor ? { backgroundColor: branding.backgroundColor } : {};

  // Landing mode
  if (chatMode === 'landing') {
    return (
      <div
        className="h-full flex flex-col"
        style={{
          ...bgStyles,
          fontFamily,
          ['--chat-primary' as any]: branding?.primaryColor,
          ['--chat-accent' as any]: branding?.accentColor,
        }}
      >
        <ChatLandingPage
          branding={branding}
          quickStartPrompts={quickStartConfig.prompts}
          inputPlaceholder={inputConfig.placeholder}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onPromptClick={(text) => {
            if (quickStartConfig.autoSend) typeAndSend(text);
            else setInput(text);
          }}
          sending={sending}
          autoSend={quickStartConfig.autoSend}
          isTypingPrompt={isTypingPrompt}
        />
      </div>
    );
  }

  // Welcome mode
  if (chatMode === 'welcome') {
    return (
      <div className="h-full" style={{ ...bgStyles, fontFamily }}>
        <WelcomeScreen
          config={welcomeScreenConfig}
          chatTitle={branding?.chatTitle}
          primaryColor={branding?.primaryColor}
          branding={branding}
          onStart={() => setChatMode('chat')}
        />
      </div>
    );
  }

  // Full chat mode
  return (
    <div
      ref={scrollContainerRef}
      className="h-full flex flex-col overflow-auto"
      style={{
        ...bgStyles,
        fontFamily,
        ['--chat-primary' as any]: branding?.primaryColor,
        ['--chat-accent' as any]: branding?.accentColor,
      }}
    >
      {/* Messages */}
      <div
        className="flex-1 mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"
        style={{ maxWidth: `${layoutConfig.maxMessageWidth}px` }}
      >
        <MessageList
          messages={messages}
          branding={branding}
          layoutConfig={layoutConfig}
          behaviorConfig={behaviorConfig}
          interactiveConfig={interactiveConfig}
          copiedMessageId={copiedMessageId}
          copiedCodeBlock={copiedCodeBlock}
          onCopyMessage={handleCopyMessage}
          onCopyCode={handleCopyCode}
          onRegenerate={handleRegenerate}
          sending={sending}
        />
        {sending && (
          <div className="flex justify-start animate-fade-in">
            <Card className="bg-card">
              <div className="p-4">
                <TypingIndicator />
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 rounded-full h-12 w-12 shadow-lg z-50"
          size="icon"
          variant="secondary"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}

      {/* Input */}
      <div className="border-t border-border/20 bg-background/80 backdrop-blur-sm">
        <div
          className="mx-auto px-4 sm:px-6 lg:px-8 py-4"
          style={{ maxWidth: `${layoutConfig.maxMessageWidth}px` }}
        >
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => handleSend()}
            sending={sending}
            placeholder={inputConfig.placeholder}
            inputStyle={inputStyle}
            buttonStyle={buttonStyle}
            inputSize={behaviorConfig.inputSize}
            primaryColor={branding?.primaryColor}
          />
        </div>
      </div>
    </div>
  );
}
