import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import { Loader2, RotateCcw, ArrowDown, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { sendToWebhook } from "@/lib/webhookService";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { SessionManager } from "@/lib/SessionManager";
import { PublicChat } from "@/components/PublicChat";
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
import type { ChatBranding } from "@/types/chatConfiguration";
import { QuickStartPrompts } from "@/components/QuickStartPrompts";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatLandingPage } from "@/components/ChatLandingPage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatSidebar } from "@/components/ChatSidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useUserPlan } from "@/hooks/useUserPlan";
import { createCheckoutSession } from "@/lib/stripe";

interface ChatInstance {
  id: string;
  name: string;
  slug: string | null;
  webhook_url: string;
  n8n_auth_enabled?: boolean;
  n8n_auth_username?: string;
  n8n_auth_password?: string;
  user_id: string;
  chat_type?: 'public' | 'authenticated';
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
  const { theme, resolvedTheme } = useTheme();
  const [chatInstances, setChatInstances] = useState<ChatInstance[]>([]);
  
  const [user, setUser] = useState<any>(null);
  const [chatInstance, setChatInstance] = useState<ChatInstance | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatMode, setChatMode] = useState<'landing' | 'welcome' | 'chat'>('landing');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedCodeBlock, setCopiedCodeBlock] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isTypingPrompt, setIsTypingPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Session management will be initialized after we know the chatInstance.id
  const [sessionId, setSessionId] = useState<string>("");
  const [viewTracked, setViewTracked] = useState(false);
  const [ownerHidesBranding, setOwnerHidesBranding] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const userPlan = useUserPlan();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    const loadChatInstance = async () => {
      if (!id) {
        navigate("/dashboard");
        return;
      }

      try {
        // Load all chat instances for admin sidebar if user is authenticated
        const { data: { session: currentAuthSession } } = await supabase.auth.getSession();
        if (currentAuthSession?.user) {
          const { data: allChats } = await supabase
            .from("chat_instances")
            .select("*")
            .eq("user_id", currentAuthSession.user.id)
            .order("created_at", { ascending: false });
          
          if (allChats) {
            setChatInstances(allChats as unknown as ChatInstance[]);
          }
        }
        // Try loading by UUID first (for owner access)
        let query = supabase
          .from("chat_instances")
          .select("*");

        // Check if id is a valid UUID format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
          // Load by UUID (owner view - requires authentication)
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`);
            return;
          }

          setUser(session.user);
          query = query.eq("id", id).eq("user_id", session.user.id);
        } else {
          // Load by slug (public view - no authentication required)
          query = query.eq("slug", id);
        }

        const { data, error } = await query.single();

        if (error) throw error;

        const instance = data as unknown as ChatInstance;
        setChatInstance(instance);
        
        // PUBLIC MODE: Skip all session/user logic
        if (instance.chat_type === 'public') {
          setLoading(false);
          return;
        }
        
        // AUTHENTICATED MODE: Require login
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession) {
          navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        
        // Initialize session for authenticated user
        const forceNew = searchParams.get("new") === "1";
        const manager = new SessionManager(instance.id, authSession.user.id);
        
        if (forceNew) {
          const newSessionId = await manager.createNewSession();
          setSessionId(newSessionId);
        } else {
          const currentSessionId = await manager.getLatestSession();
          setSessionId(currentSessionId || ""); // Empty string if no sessions
        }
        
        // Check if owner wants to hide branding (for public viewers only)
        const { data: { session: ownerSession } } = await supabase.auth.getSession();
        const userIsOwner = ownerSession?.user?.id === instance.user_id;
        setIsOwner(userIsOwner);
        
        if (!userIsOwner && instance.user_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("hide_branding_badge")
            .eq("id", instance.user_id)
            .maybeSingle();
          
          setOwnerHidesBranding(profileData?.hide_branding_badge || false);
        }
        
        // Track view event (only for public shared chats accessed via slug)
        if (!isUUID && !viewTracked) {
          await trackAnalyticsEvent({
            chat_instance_id: instance.id,
            session_id: sessionId,
            event_type: "view",
          });
          setViewTracked(true);
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

    return () => subscription.unsubscribe();
  }, [id, navigate, toast, sessionId, viewTracked]);

  // Load messages from database for this session
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatInstance) return;
      if (!sessionId) return; // Don't load messages for empty session

      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("chat_instance_id", chatInstance.id)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Load existing messages from database
          const loadedMessages: Message[] = data.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(loadedMessages);
        } else {
          // No existing messages, show welcome message if not in landing mode
          const branding = chatInstance.custom_branding as any;
          const uxConfig = getUXConfig(branding);
          
          if (!uxConfig.useLandingPageMode) {
            const welcomeMessage: Message = {
              id: "welcome",
              role: "assistant",
              content: branding?.welcomeMessage || "Hi! How can I help you today?",
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
            
            // Save welcome message to DB
            await supabase.from("chat_messages").insert({
              chat_instance_id: chatInstance.id,
              session_id: sessionId,
              role: "assistant",
              content: welcomeMessage.content,
            });
          }
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [chatInstance, sessionId]);

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

  // Cleanup typing animation on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Type out text gradually and then send
  const typeAndSend = async (text: string) => {
    setIsTypingPrompt(true);
    setInput("");
    
    // Type out character by character
    for (let i = 0; i <= text.length; i++) {
      await new Promise(resolve => {
        typingTimeoutRef.current = setTimeout(resolve, 30); // 30ms per character
      });
      setInput(text.slice(0, i));
    }
    
    // Small pause before sending
    await new Promise(resolve => {
      typingTimeoutRef.current = setTimeout(resolve, 200);
    });
    
    setIsTypingPrompt(false);
    handleSend(text);
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || !chatInstance) return;

    // Create session on first message if needed
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const manager = new SessionManager(chatInstance.id, session.user.id);
        activeSessionId = await manager.createNewSession();
        setSessionId(activeSessionId);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    // Save user message to database
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

    // Transition to chat mode after first message
    if (chatMode === 'landing' || chatMode === 'welcome') {
      setChatMode('chat');
    }

    // Track message sent event
    await trackAnalyticsEvent({
      chat_instance_id: chatInstance.id,
      session_id: activeSessionId,
      event_type: "message_sent",
      metadata: {
        message_length: userMessage.content.length,
      },
    });

    try {
      const branding = chatInstance.custom_branding as any;
      const metadataConfig = getMetadataConfig(branding);
      
      const assistantContent = await sendToWebhook(
        {
          url: chatInstance.webhook_url,
          authEnabled: chatInstance.n8n_auth_enabled,
          username: chatInstance.n8n_auth_username,
          password: chatInstance.n8n_auth_password,
        },
        {
          message: userMessage.content,
          sessionId: activeSessionId,
          chatInstance: { id: chatInstance.id, slug: chatInstance.slug },
          metadataConfig,
        }
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Save assistant message to database
      try {
        await supabase.from("chat_messages").insert({
          chat_instance_id: chatInstance.id,
          session_id: activeSessionId,
          role: "assistant",
          content: assistantMessage.content,
        });
      } catch (error) {
        console.error("Error saving assistant message:", error);
      }
      
      // Track message received event
      await trackAnalyticsEvent({
        chat_instance_id: chatInstance.id,
        session_id: activeSessionId,
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

  const handleCopyCode = async (code: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeBlock(blockId);
      toast({
        title: "Copied to clipboard",
        description: "Code copied successfully",
      });
      setTimeout(() => setCopiedCodeBlock(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async () => {
    if (!chatInstance || messages.length < 2) return;
    
    // Find the last assistant message (reverse iteration)
    let lastAssistantIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        lastAssistantIndex = i;
        break;
      }
    }
    
    if (lastAssistantIndex === -1) return;
    
    // Find the user message before it
    const userMessage = messages
      .slice(0, lastAssistantIndex)
      .reverse()
      .find(m => m.role === "user");
    
    if (!userMessage) return;
    
    // Remove the last assistant message
    const messagesWithoutLastAssistant = messages.slice(0, lastAssistantIndex);
    setMessages(messagesWithoutLastAssistant);
    
    // Resend the user message
    setSending(true);
    const branding = chatInstance.custom_branding as any;
    const metadataConfig = getMetadataConfig(branding);

    try {
      const assistantContent = await sendToWebhook(
        {
          url: chatInstance.webhook_url,
          authEnabled: chatInstance.n8n_auth_enabled,
          username: chatInstance.n8n_auth_username,
          password: chatInstance.n8n_auth_password,
        },
        {
          message: userMessage.content,
          sessionId,
          chatInstance: { id: chatInstance.id, slug: chatInstance.slug },
          metadataConfig,
        }
      );

      const newAssistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages([...messagesWithoutLastAssistant, newAssistantMessage]);

      // Delete the old assistant message from database
      if (messages[lastAssistantIndex]?.id) {
        try {
          await supabase
            .from("chat_messages")
            .delete()
            .eq("id", messages[lastAssistantIndex].id);
        } catch (error) {
          console.error("Error deleting old assistant message:", error);
        }
      }

      // Save new assistant message to database
      try {
        const { data: savedMessage } = await supabase
          .from("chat_messages")
          .insert({
            chat_instance_id: chatInstance.id,
            session_id: sessionId,
            role: "assistant",
            content: assistantContent,
          })
          .select()
          .single();

        // Update the message ID with the database ID
        if (savedMessage) {
          newAssistantMessage.id = savedMessage.id;
        }
      } catch (error) {
        console.error("Error saving regenerated message:", error);
      }

      await trackAnalyticsEvent({
        chat_instance_id: chatInstance.id,
        session_id: sessionId,
        event_type: "message_sent",
        metadata: { regenerated: true }
      });
    } catch (error: any) {
      console.error("Error regenerating message:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive",
      });
      // Restore the original assistant message on error
      setMessages(messages);
    } finally {
      setSending(false);
    }
  };

  const handleResetSession = async () => {
    if (!chatInstance || !user) return;
    
    const sessionManager = new SessionManager(chatInstance.id, user.id);
    const newSessionId = await sessionManager.createNewSession();
    setSessionId(newSessionId);
    setViewTracked(false);
    
    // Reset messages to welcome message (smart behavior: skip if landing page mode is enabled)
    const branding = chatInstance?.custom_branding as any;
    const uxConfig = getUXConfig(branding);
    
    if (!uxConfig.useLandingPageMode) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: branding?.welcomeMessage || "Hi! How can I help you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      
      // Save welcome message to new session
      try {
        await supabase.from("chat_messages").insert({
          chat_instance_id: chatInstance.id,
          session_id: newSessionId,
          role: "assistant",
          content: welcomeMessage.content,
        });
      } catch (error) {
        console.error("Error saving welcome message:", error);
      }
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

  const handleSessionSelect = (newSessionId: string) => {
    if (!chatInstance || !user) return;
    
    // Switch to the selected session
    const sessionManager = new SessionManager(chatInstance.id, user.id);
    sessionManager.switchSession(newSessionId);
    setSessionId(newSessionId);
    
    // Messages will be reloaded by the useEffect that watches sessionId
    toast({
      title: "Session switched",
      description: "Loaded previous conversation",
    });
  };

  const handleNewSession = () => {
    handleResetSession();
  };

  const handleUpgradeToPro = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate("/auth");
        return;
      }

      await createCheckoutSession();
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to start upgrade process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Utility: Calculate text color based on background brightness
  const getTextColor = (bgColor: string, currentIsDark: boolean) => {
    // Handle transparent - defer to theme
    if (bgColor === 'transparent') {
      return currentIsDark ? '#ffffff' : '#000000';
    }
    
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  // Utility: Determine button style variant based on template
  const getButtonStyleVariant = () => {
    const branding = chatInstance?.custom_branding as any;
    if (!branding) return 'openai';
    
    // Claude style: light mode, ghost buttons, floating input, no sidebar
    if (branding.colorMode === 'light' && 
        branding.buttonStyle === 'ghost' &&
        branding.inputPosition === 'floating' &&
        branding.showSidebar === false &&
        branding.primaryColor === '#d97757') {
      return 'claude';
    }
    
    // Grok style: dark mode, minimal header, high border radius
    if (branding.colorMode === 'dark' && 
        branding.headerStyle === 'minimal' &&
        branding.borderRadius >= 20 &&
        branding.backgroundColor === '#0f0f0f') {
      return 'grok';
    }
    
    // Default to OpenAI/standard style
    return 'openai';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chatInstance) return null;

  // PUBLIC CHAT MODE: Render PublicChat component
  if (chatInstance.chat_type === 'public') {
    return <PublicChat chatInstance={chatInstance} />;
  }

  // AUTHENTICATED CHAT MODE: Full featured chat with sessions
  const branding = chatInstance.custom_branding as any;
  const quickStartConfig = getQuickStartPromptsConfig(branding);
  const welcomeScreenConfig = getWelcomeScreen(branding);
  const inputConfig = getInputConfig(branding);
  const layoutConfig = getLayoutConfig(branding);
  const behaviorConfig = getMessageBehaviorConfig(branding);
  const interactiveConfig = getInteractiveConfig(branding);

  // Landing page mode - no header, just centered input
  if (chatMode === 'landing') {
    const landingColorMode = branding?.colorMode || 'light';
    const landingIsDark = landingColorMode === 'auto' 
      ? resolvedTheme === 'dark'
      : landingColorMode === 'dark';
    
    const bgStyles = branding?.backgroundStyle === 'gradient' && branding?.backgroundGradientStart && branding?.backgroundGradientEnd
      ? { background: `linear-gradient(135deg, ${branding.backgroundGradientStart}, ${branding.backgroundGradientEnd})` }
      : landingColorMode === 'auto'
      ? { backgroundColor: landingIsDark ? '#212121' : '#ffffff' }
      : branding?.backgroundColor ? { backgroundColor: branding.backgroundColor } : {};
      
    // ADMIN/OWNER VIEW: Expanded sidebar (Grok pattern)
    if (isOwner) {
      return (
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full">
            <AppSidebar
              mode="chat"
              currentChatId={chatInstance.id}
              currentSessionId={sessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              onChatSelect={(chatId) => {
                const chat = chatInstances.find(c => c.id === chatId);
                if (chat) {
                  navigate(`/chat/${chat.slug || chat.id}`);
                }
              }}
              userEmail={user?.email}
              userPlan={userPlan.plan}
              onUpgrade={handleUpgradeToPro}
              onLogout={handleLogout}
              canCreateMore={userPlan.plan?.can_create_more_chats ?? false}
            />
            
            {/* Main content area with landing page */}
            <main 
              className="flex-1 flex flex-col transition-all duration-200"
              style={{
                ...bgStyles,
                ['--chat-primary' as any]: chatInstance.custom_branding.primaryColor,
                ['--chat-accent' as any]: chatInstance.custom_branding.accentColor,
              }}
            >
              {/* Header with breadcrumbs and theme toggle */}
              <header 
                className="border-b backdrop-blur-sm sticky top-0 z-10"
                style={{
                  backgroundColor: bgStyles.backgroundColor ? `${bgStyles.backgroundColor}cc` : 'hsl(var(--background) / 0.8)',
                  borderColor: 'hsl(var(--border))',
                }}
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbLink 
                            href="/dashboard"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Home className="h-4 w-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{chatInstance.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              
              {/* Landing Page Content */}
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
            </main>
          </div>
        </SidebarProvider>
      );
    }
    
    // PUBLIC USER VIEW: Collapsed sidebar (Claude pattern)
    return (
      <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-screen w-full">
          <ChatSidebar
            chatInstanceId={chatInstance.id}
            currentSessionId={sessionId}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
            isOwner={false}
            userId={user?.id}
            routeId={id}
            chatSlug={chatInstance.slug}
          />
          
          {/* Main content area with landing page */}
          <main 
            className="flex-1 flex flex-col transition-all duration-200"
            style={{
              ...bgStyles,
              ['--chat-primary' as any]: chatInstance.custom_branding.primaryColor,
              ['--chat-accent' as any]: chatInstance.custom_branding.accentColor,
            }}
          >
            {/* Header with theme toggle */}
            <header 
              className="border-b backdrop-blur-sm sticky top-0 z-10"
              style={{
                backgroundColor: bgStyles.backgroundColor ? `${bgStyles.backgroundColor}cc` : 'hsl(var(--background) / 0.8)',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <div className="max-w-4xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  {layoutConfig.headerStyle !== 'minimal' && (
                    <h1 className="font-semibold text-xl">
                      {chatInstance.custom_branding.chatTitle}
                    </h1>
                  )}
                  <div className={layoutConfig.headerStyle === 'minimal' ? 'ml-auto' : ''}>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </header>
            
            {/* Landing Page Content */}
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
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Full chat interface with header
  const fontFamily = branding?.fontFamily || 'Inter';
  const messageBubbleStyle = branding?.messageBubbleStyle || 'rounded';
  const messageDensity = branding?.messageDensity || 'comfortable';
  const showTimestamps = branding?.showTimestamps || 'hover';
  const borderRadius = branding?.borderRadius || 8;
  const userMessageColor = branding?.userMessageColor;
  const botMessageColor = branding?.botMessageColor;
  const backgroundColor = branding?.backgroundColor;
  const backgroundStyle = branding?.backgroundStyle || 'solid';
  const backgroundGradientStart = branding?.backgroundGradientStart;
  const backgroundGradientEnd = branding?.backgroundGradientEnd;
  const inputStyle = branding?.inputStyle || 'outline';
  const buttonStyle = branding?.buttonStyle || 'filled';
  const colorMode = branding?.colorMode || 'light';
  
  // Determine if we're in dark mode - respect theme when colorMode is 'auto'
  const isDark = colorMode === 'auto' 
    ? resolvedTheme === 'dark'
    : colorMode === 'dark' || (backgroundColor && getTextColor(backgroundColor, colorMode === 'dark') === '#ffffff');
  
  // Background styles - respect theme when colorMode is 'auto'
  const getBackgroundStyles = () => {
    if (backgroundStyle === 'gradient' && backgroundGradientStart && backgroundGradientEnd) {
      return { background: `linear-gradient(135deg, ${backgroundGradientStart}, ${backgroundGradientEnd})` };
    }
    
    if (colorMode === 'auto') {
      return isDark 
        ? { backgroundColor: '#212121' } // ChatGPT's dark mode background
        : { backgroundColor: '#ffffff' };
    }
    
    return backgroundColor ? { backgroundColor } : {};
  };
  
  const bgStyles = getBackgroundStyles();
  
  const getBubbleRadius = () => {
    if (messageBubbleStyle === 'sharp') return '4px';
    if (messageBubbleStyle === 'pill') return '24px';
    return `${borderRadius}px`;
  };
  
  const getDensityPadding = () => {
    if (messageDensity === 'compact') return 'py-2 px-3';
    if (messageDensity === 'spacious') return 'py-4 px-5';
    return 'py-3 px-4';
  };

  const getMessageSpacing = () => {
    if (behaviorConfig.messageSpacing === 'tight') return 'mb-4';
    if (behaviorConfig.messageSpacing === 'relaxed') return 'mb-8';
    return 'mb-6';
  };

  const getAnimationClass = () => {
    if (behaviorConfig.animationSpeed === 'fast') return 'animate-fade-in duration-150';
    if (behaviorConfig.animationSpeed === 'slow') return 'animate-fade-in duration-500';
    return 'animate-fade-in';
  };

  const getHeaderClass = () => {
    if (layoutConfig.headerStyle === 'minimal') return 'py-2';
    if (layoutConfig.headerStyle === 'prominent') return 'py-6 shadow-md';
    return 'py-4';
  };

  const getMessageAlignment = () => {
    if (layoutConfig.messageAlignment === 'center') return 'mx-auto';
    if (layoutConfig.messageAlignment === 'full-width') return 'max-w-full';
    return '';
  };

  const getAvatarSize = () => {
    if (layoutConfig.avatarSize === 'small') return 'h-6 w-6';
    if (layoutConfig.avatarSize === 'large') return 'h-12 w-12';
    return 'h-8 w-8';
  };

  const getInputSize = () => {
    if (behaviorConfig.inputSize === 'compact') return 'h-10';
    if (behaviorConfig.inputSize === 'large') return 'h-14 text-base';
    return 'h-12';
  };

  const getInputStyleClasses = () => {
    if (inputStyle === 'filled') {
      return isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10';
    } else if (inputStyle === 'underline') {
      return 'border-0 border-b rounded-none';
    }
    return '';
  };

  const getButtonClasses = () => {
    if (buttonStyle === 'ghost') {
      return 'bg-transparent hover:bg-white/10 border-0';
    } else if (buttonStyle === 'outline') {
      return 'bg-transparent hover:bg-white/10 border';
    }
    return '';
  };
  
  return (
    <SidebarProvider defaultOpen={isOwner}>
      <div className="flex min-h-screen w-full" style={{ fontFamily }}>
        {/* Unified Admin Sidebar - for owners */}
        {isOwner ? (
          <AppSidebar
            mode="chat"
            currentChatId={chatInstance.id}
            currentSessionId={sessionId}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
            onChatSelect={(chatId) => {
              // Navigate to the selected chat
              const chat = chatInstances.find(c => c.id === chatId);
              if (chat) {
                navigate(`/chat/${chat.slug || chat.id}`);
              }
            }}
            userEmail={user?.email}
            userPlan={userPlan.plan}
            onUpgrade={handleUpgradeToPro}
            onLogout={handleLogout}
            canCreateMore={userPlan.plan?.can_create_more_chats ?? false}
          />
        ) : (
          /* Public Chat Sidebar - for visitors */
          layoutConfig.showSidebar && layoutConfig.allowAnonymousHistory && (
            <ChatSidebar
              chatInstanceId={chatInstance.id}
              currentSessionId={sessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              isOwner={false}
              userId={user?.id}
              routeId={id}
              chatSlug={chatInstance.slug}
            />
          )
        )}

        {/* Main content */}
        <div
          className={`flex-1 min-h-screen ${getAnimationClass()}`}
          style={{
            ...bgStyles,
            ['--chat-primary' as any]: chatInstance.custom_branding.primaryColor,
            ['--chat-accent' as any]: chatInstance.custom_branding.accentColor,
          }}
        >
          <ChatHeader
            isOwner={isOwner}
            chatTitle={chatInstance.custom_branding.chatTitle}
            headerStyle={layoutConfig.headerStyle}
            isDark={isDark}
          />

          {/* Main Content */}
          {chatMode === 'welcome' ? (
        <WelcomeScreen
          config={welcomeScreenConfig}
          chatTitle={branding.chatTitle}
          primaryColor={branding.primaryColor}
          branding={branding}
          onStart={() => setChatMode('chat')}
        />
      ) : (
        <>
          {/* Chat Messages */}
          <div 
            className="mx-auto px-4 sm:px-6 lg:px-8 py-8"
            style={{ maxWidth: `${layoutConfig.maxMessageWidth}px` }}
          >
            {/* Sign-in prompt for anonymous users with chat history */}
            {!user && !isOwner && messages.length >= 2 && (
              <SignInPrompt onSignIn={() => navigate('/auth')} />
            )}
            
            <MessageList
              messages={messages}
              theme={theme}
              isDark={isDark}
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
                <Card style={{ backgroundColor: botMessageColor || 'transparent' }}>
                  <div className="p-4">
                    <TypingIndicator dotColor={botMessageColor && botMessageColor !== 'transparent' ? getTextColor(botMessageColor, isDark) : isDark ? '#ffffff' : '#000000'} />
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

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

            {/* Input Area */}
            <div 
              className={`left-0 right-0 border-t backdrop-blur-sm ${
                behaviorConfig.inputPosition === 'floating' 
                  ? 'relative max-w-3xl mx-auto rounded-t-xl shadow-lg' 
                  : 'fixed bottom-0'
              }`}
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }}
            >
              <div 
                className="mx-auto px-4 sm:px-6 lg:px-8 py-4"
                style={{ maxWidth: behaviorConfig.inputPosition === 'floating' ? '100%' : `${layoutConfig.maxMessageWidth}px` }}
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
                  isDark={isDark}
                  primaryColor={chatInstance.custom_branding.primaryColor}
                />
              </div>
            </div>
          </>
        )}
        </div>
      </div>

      {/* Branding Badge - Bottom Right (Lovable-inspired) */}
      {!isOwner && !ownerHidesBranding && (
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-4 z-50 text-xs text-muted-foreground hover:text-foreground transition-all duration-300 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/50 bg-background/50 hover:bg-background/80 shadow-sm hover:shadow-md"
          style={{ 
            bottom: behaviorConfig.inputPosition === 'sticky-bottom' ? '5.5rem' : '1rem' 
          }}
        >
          <span className="flex items-center gap-1">
            Powered by <span className="font-semibold">Flowify</span>
          </span>
        </a>
      )}
    </SidebarProvider>
  );
};

export default Chat;
