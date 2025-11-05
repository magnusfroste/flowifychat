import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2, RotateCcw, Copy, Check, ArrowDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { trackAnalyticsEvent, buildWebhookPayload } from "@/lib/analytics";
import {
  getOrCreateSessionId,
  clearSessionId,
  getChatKeyFromRouteOrInstance,
  migrateSessionId,
} from "@/lib/session";
import {
  getQuickStartPromptsConfig,
  getWelcomeScreen,
  getInputConfig,
  getMetadataConfig,
  getUXConfig,
} from "@/lib/chatConfig";
import { QuickStartPrompts } from "@/components/QuickStartPrompts";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatLandingPage } from "@/components/ChatLandingPage";
import { TypingIndicator } from "@/components/TypingIndicator";

interface ChatInstance {
  id: string;
  name: string;
  slug: string | null;
  webhook_url: string;
  custom_branding: {
    primaryColor: string;
    accentColor: string;
    avatarUrl: string | null;
    welcomeMessage: string;
    chatTitle: string;
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  
  const [chatInstance, setChatInstance] = useState<ChatInstance | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatMode, setChatMode] = useState<'landing' | 'welcome' | 'chat'>('landing');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState(() => {
    // Check if ?new=1 param forces a new session
    const forceNew = searchParams.get("new") === "1";
    const routeKey = getChatKeyFromRouteOrInstance(id);
    
    if (forceNew) {
      clearSessionId(routeKey);
    }
    
    return getOrCreateSessionId(routeKey);
  });
  const [viewTracked, setViewTracked] = useState(false);

  useEffect(() => {
    const loadChatInstance = async () => {
      if (!id) {
        navigate("/dashboard");
        return;
      }

      try {
        // Try loading by UUID first (for owner access)
        let query = supabase
          .from("chat_instances")
          .select("*");

        // Check if id is a valid UUID format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
          // Load by UUID (owner view - requires authentication)
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            navigate("/auth");
            return;
          }

          query = query.eq("id", id).eq("user_id", user.id);
        } else {
          // Load by slug (public view - no authentication required)
          query = query.eq("slug", id);
        }

        const { data, error } = await query.single();

        if (error) throw error;

        const instance = data as unknown as ChatInstance;
        setChatInstance(instance);
        
        // Migrate sessionId to canonical key (instance.id) if needed
        const routeKey = getChatKeyFromRouteOrInstance(id);
        const canonicalKey = getChatKeyFromRouteOrInstance(id, instance.id);
        
        if (routeKey !== canonicalKey) {
          migrateSessionId(routeKey, canonicalKey);
          const migratedSessionId = getOrCreateSessionId(canonicalKey);
          setSessionId(migratedSessionId);
        }
        
        // Track view event (only for public shared chats accessed via slug)
        // Delay until sessionId is confirmed from canonical key
        if (!isUUID && !viewTracked) {
          await trackAnalyticsEvent({
            chat_instance_id: instance.id,
            session_id: routeKey !== canonicalKey ? getOrCreateSessionId(canonicalKey) : sessionId,
            event_type: "view",
          });
          setViewTracked(true);
        }
        
        // Add welcome message (smart behavior: skip if landing page mode is enabled)
        const branding = data.custom_branding as unknown as ChatInstance["custom_branding"];
        const uxConfig = getUXConfig(branding);
        
        if (!uxConfig.useLandingPageMode) {
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: branding.welcomeMessage,
              timestamp: new Date(),
            },
          ]);
        } else {
          setMessages([]);
        }
      } catch (error: any) {
        console.error("Error loading chat instance:", error);
        toast({
          title: "Error",
          description: "Failed to load chat instance",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadChatInstance();
  }, [id, navigate, toast, sessionId, viewTracked]);

  // Determine chat mode based on configuration and message count
  useEffect(() => {
    if (!chatInstance) return;

    const branding = chatInstance.custom_branding as any;
    const uxConfig = getUXConfig(branding);
    const welcomeScreenConfig = getWelcomeScreen(branding);

    // Determine initial mode based on message count and configuration
    // In landing page mode: show landing until first user message (messages.length === 0)
    // In other modes: show landing/welcome if we just have the initial welcome message
    if (uxConfig.useLandingPageMode) {
      if (messages.length === 0) {
        setChatMode('landing');
      } else {
        setChatMode('chat');
      }
    } else if (messages.length <= 1) {
      if (welcomeScreenConfig.enabled) {
        setChatMode('welcome');
      } else {
        setChatMode('chat');
      }
    } else {
      setChatMode('chat');
    }
  }, [chatInstance, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollButton]);

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isNearBottom);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || !chatInstance) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    // Transition to chat mode after first message
    if (chatMode === 'landing' || chatMode === 'welcome') {
      setChatMode('chat');
    }

    // Track message sent event
    await trackAnalyticsEvent({
      chat_instance_id: chatInstance.id,
      session_id: sessionId,
      event_type: "message_sent",
      metadata: {
        message_length: userMessage.content.length,
      },
    });

    try {
      // Build enhanced webhook payload
      const branding = chatInstance.custom_branding as any;
      const metadataConfig = getMetadataConfig(branding);
      const payload = buildWebhookPayload(
        userMessage.content,
        sessionId,
        { id: chatInstance.id, slug: chatInstance.slug },
        metadataConfig
      );

      // Send to n8n webhook
      const response = await fetch(chatInstance.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send message to webhook");
      }

      // Read response as text first (works for both streaming and non-streaming)
      const text = await response.text();
      let assistantContent = '';

      // Try parsing as regular JSON first (non-streaming)
      try {
        const data = JSON.parse(text);
        
        // Handle error responses
        if (data.type === "error") {
          throw new Error(data.content || "Error from webhook");
        }
        
        // Handle single JSON response (non-streaming)
        assistantContent = data.output || data.content || data.response || '';
        
      } catch (e) {
        // If single JSON parse fails, try NDJSON (streaming format)
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            
            // Handle streaming error
            if (parsed.type === 'error') {
              throw new Error(parsed.content || 'Error from webhook');
            }
            
            // Handle streaming items (n8n streaming format)
            if (parsed.type === 'item' && parsed.content) {
              assistantContent += parsed.content;
            }
            // Handle non-streaming single-line format (fallback for NDJSON without 'type')
            else if (!parsed.type && (parsed.output || parsed.content || parsed.response)) {
              assistantContent += parsed.output || parsed.content || parsed.response;
            }
          } catch (lineError) {
            // Skip invalid JSON lines
            console.warn('Skipping invalid JSON line:', line);
          }
        }
      }

      // Add assistant response with accumulated content
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent || "I received your message!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Track message received event
      await trackAnalyticsEvent({
        chat_instance_id: chatInstance.id,
        session_id: sessionId,
        event_type: "message_received",
        metadata: {
          response_length: assistantContent.length,
        },
      });
    } catch (error: any) {
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
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: "Copied to clipboard",
        description: "Message copied successfully",
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleResetSession = () => {
    const canonicalKey = getChatKeyFromRouteOrInstance(id, chatInstance?.id);
    clearSessionId(canonicalKey);
    const newSessionId = getOrCreateSessionId(canonicalKey);
    setSessionId(newSessionId);
    setViewTracked(false);
    
    // Reset messages to welcome message (smart behavior: skip if landing page mode is enabled)
    const branding = chatInstance?.custom_branding as any;
    const uxConfig = getUXConfig(branding);
    
    if (!uxConfig.useLandingPageMode) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: branding?.welcomeMessage || "Hi! How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([]);
    }


    // Reset to initial mode based on configuration
    const welcomeScreenConfig = getWelcomeScreen(branding);
    
    if (uxConfig.useLandingPageMode) {
      setChatMode('landing');
    } else if (welcomeScreenConfig.enabled) {
      setChatMode('welcome');
    } else {
      setChatMode('chat');
    }
    
    toast({
      title: "Session reset",
      description: "Started a new conversation",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chatInstance) return null;

  const branding = chatInstance.custom_branding as any;
  const quickStartConfig = getQuickStartPromptsConfig(branding);
  const welcomeScreenConfig = getWelcomeScreen(branding);
  const inputConfig = getInputConfig(branding);
  const isOwner = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

  // Landing page mode - no header, just centered input
  if (chatMode === 'landing') {
    return (
      <div
        className="min-h-screen bg-gradient-subtle"
        style={{
          "--chat-primary": chatInstance.custom_branding.primaryColor,
          "--chat-accent": chatInstance.custom_branding.accentColor,
        } as React.CSSProperties}
      >
        <ChatLandingPage
          chatTitle={branding.chatTitle}
          primaryColor={branding.primaryColor}
          quickStartPrompts={quickStartConfig.prompts}
          inputPlaceholder={inputConfig.placeholder}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onPromptClick={(text) => {
            if (quickStartConfig.autoSend) {
              setInput(text);
              setTimeout(() => handleSend(), 0);
            } else {
              setInput(text);
            }
          }}
          sending={sending}
          autoSend={quickStartConfig.autoSend}
        />
      </div>
    );
  }

  // Full chat interface with header
  return (
    <div
      className="min-h-screen bg-gradient-subtle animate-fade-in"
      style={{
        "--chat-primary": chatInstance.custom_branding.primaryColor,
        "--chat-accent": chatInstance.custom_branding.accentColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Only show back button if viewing by UUID (owner) */}
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <h1 className="text-xl font-semibold">
                {chatInstance.custom_branding.chatTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetSession}
                title="Reset conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {/* Show branding badge if accessed via slug */}
              {!isOwner && (
                <a
                  href="/"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Powered by <span className="font-semibold">FlowChat</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {chatMode === 'welcome' ? (
        <WelcomeScreen
          config={welcomeScreenConfig}
          chatTitle={branding.chatTitle}
          primaryColor={branding.primaryColor}
          onStart={() => setChatMode('chat')}
        />
      ) : (
        <>
          {/* Chat Messages */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="space-y-6 mb-32">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex animate-scale-in group mb-6 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="relative max-w-[80%]">
                    <div
                      className={`py-3 px-4 ${
                        message.role === "user"
                          ? "bg-muted/30 rounded-2xl"
                          : "border-l-4 border-accent pl-4"
                      }`}
                    >
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-pre:bg-muted prose-pre:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || "");
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={theme === "dark" ? oneDark : oneLight}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <p className="text-xs mt-2 text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className="absolute top-1 -right-10 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      title="Copy message"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
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

            {/* Quick Start Prompts - Show only when there's just the welcome message */}
            {messages.length === 1 && quickStartConfig.prompts.length > 0 && (
              <div className="mb-32">
                <QuickStartPrompts
                  prompts={quickStartConfig.prompts}
                  onPromptClick={(text) => {
                    if (quickStartConfig.autoSend) {
                      // Auto-send the prompt
                      setInput(text);
                      setTimeout(() => handleSend(), 0);
                    } else {
                      // Just populate the input field
                      setInput(text);
                    }
                  }}
                  disabled={sending}
                  primaryColor={branding.primaryColor}
                />
              </div>
            )}

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
              <Button
                onClick={scrollToBottom}
                className="fixed bottom-24 right-8 rounded-full h-12 w-12 shadow-lg animate-fade-in z-50"
                size="icon"
                variant="secondary"
              >
                <ArrowDown className="h-5 w-5" />
              </Button>
            )}

            {/* Input Area - Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={inputConfig.placeholder}
                    className="bg-background"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    style={{ backgroundColor: branding.primaryColor }}
                    className={`text-white ${input.trim() && !sending ? 'animate-pulse' : ''}`}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {inputConfig.submitLabel}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
