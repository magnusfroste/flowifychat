/**
 * Hook: Manage chat messages for authenticated mode
 * Handles loading, saving, sending, regenerating, and session lifecycle
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendToWebhookViaEdge } from "@/lib/edgeWebhookService";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { getMetadataConfig, getUXConfig, getWelcomeScreen } from "@/lib/chatConfig";
import { SessionManager } from "@/lib/SessionManager";
import type { ChatInstance, Message, AuthUser } from "@/types/chat";

interface UseChatMessagesOptions {
  chatInstance: ChatInstance | null;
  user: AuthUser | null;
  initialSessionId?: string;
  forceNewSession?: boolean;
}

interface UseChatMessagesResult {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  sending: boolean;
  sessionId: string;
  chatMode: "landing" | "welcome" | "chat";
  isTypingPrompt: boolean;
  viewTracked: boolean;
  handleSend: (messageText?: string) => Promise<void>;
  typeAndSend: (text: string) => void;
  handleRegenerate: () => Promise<void>;
  handleResetSession: () => Promise<void>;
  handleSessionSelect: (newSessionId: string) => void;
  handleCopyMessage: (messageId: string, content: string) => Promise<void>;
  handleCopyCode: (code: string, blockId: string) => Promise<void>;
  copiedMessageId: string | null;
  copiedCodeBlock: string | null;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function useChatMessages({
  chatInstance,
  user,
  forceNewSession = false,
}: UseChatMessagesOptions): UseChatMessagesResult {
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [chatMode, setChatMode] = useState<"landing" | "welcome" | "chat">("landing");
  const [isTypingPrompt, setIsTypingPrompt] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedCodeBlock, setCopiedCodeBlock] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize session
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      if (!chatInstance || !user || chatInstance.chat_type === "public") return;

      const manager = new SessionManager(chatInstance.id, user.id);
      let activeSessionId: string;

      if (forceNewSession) {
        activeSessionId = await manager.createNewSession();
      } else {
        activeSessionId = (await manager.getLatestSession()) || (await manager.createNewSession());
      }

      if (isMounted) {
        setSessionId(activeSessionId);

        // Track view
        if (!viewTracked) {
          await trackAnalyticsEvent({
            chat_instance_id: chatInstance.id,
            session_id: activeSessionId,
            event_type: "view",
          });
          setViewTracked(true);
        }
      }
    };

    initSession();
    return () => { isMounted = false; };
  }, [chatInstance, user, forceNewSession]);

  // Load messages from database
  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      if (!chatInstance || !sessionId) return;

      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("chat_instance_id", chatInstance.id)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (!isMounted) return;
        if (error) throw error;

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
            const welcomeMessage: Message = {
              id: "welcome",
              role: "assistant",
              content: branding?.welcomeMessage || "Hi! How can I help you today?",
              timestamp: new Date(),
            };
            if (isMounted) setMessages([welcomeMessage]);

            await supabase.from("chat_messages").insert({
              chat_instance_id: chatInstance.id,
              session_id: sessionId,
              role: "assistant",
              content: welcomeMessage.content,
            });
          }
        }
      } catch (error) {
        if (isMounted) console.error("Error loading messages:", error);
      }
    };

    loadMessages();
    return () => { isMounted = false; };
  }, [chatInstance, sessionId]);

  // Determine chat mode
  useEffect(() => {
    if (!chatInstance) return;

    const branding = chatInstance.custom_branding;
    const uxConfig = getUXConfig(branding);
    const welcomeScreenConfig = getWelcomeScreen(branding);

    if (uxConfig.useLandingPageMode) {
      setChatMode(messages.length === 0 ? "landing" : "chat");
    } else if (messages.length <= 1) {
      setChatMode(welcomeScreenConfig.enabled ? "welcome" : "chat");
    } else {
      setChatMode("chat");
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
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight >= 200);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cleanup typing animation
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const typeAndSend = useCallback((text: string) => {
    let cancelled = false;
    setIsTypingPrompt(true);
    setInput("");

    (async () => {
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        await new Promise<void>((resolve) => {
          typingTimeoutRef.current = setTimeout(() => {
            if (!cancelled) setInput(text.slice(0, i));
            resolve();
          }, 30);
        });
      }

      if (cancelled) return;
      await new Promise<void>((resolve) => {
        typingTimeoutRef.current = setTimeout(resolve, 200);
      });

      if (!cancelled) {
        setIsTypingPrompt(false);
        handleSend(text);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleSend = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || !chatInstance) return;

    // Create session on first message if needed
    let activeSessionId = sessionId;
    if (!activeSessionId && user) {
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

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    // Save user message
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

    if (chatMode === "landing" || chatMode === "welcome") {
      setChatMode("chat");
    }

    await trackAnalyticsEvent({
      chat_instance_id: chatInstance.id,
      session_id: activeSessionId,
      event_type: "message_sent",
      metadata: { message_length: userMessage.content.length },
    });

    try {
      const metadataConfig = getMetadataConfig(chatInstance.custom_branding);

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

      setMessages((prev) => [...prev, assistantMessage]);

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
  }, [input, chatInstance, sessionId, user, chatMode, toast]);

  const handleRegenerate = useCallback(async () => {
    if (!chatInstance || !sessionId) return;

    const currentMessages = [...messages];
    if (currentMessages.length < 2) return;

    let lastAssistantIndex = -1;
    for (let i = currentMessages.length - 1; i >= 0; i--) {
      if (currentMessages[i].role === "assistant") {
        lastAssistantIndex = i;
        break;
      }
    }
    if (lastAssistantIndex === -1) return;

    const userMessage = currentMessages
      .slice(0, lastAssistantIndex)
      .reverse()
      .find((m) => m.role === "user");
    if (!userMessage) return;

    const originalMessages = [...currentMessages];
    const oldAssistantId = currentMessages[lastAssistantIndex]?.id;

    setMessages((prev) => prev.slice(0, lastAssistantIndex));
    setSending(true);

    const metadataConfig = getMetadataConfig(chatInstance.custom_branding);

    try {
      const assistantContent = await sendToWebhookViaEdge({
        message: userMessage.content,
        sessionId,
        chatInstanceId: chatInstance.id,
        metadataConfig,
      });

      const newAssistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newAssistantMessage]);

      if (oldAssistantId) {
        try {
          await supabase.from("chat_messages").delete().eq("id", oldAssistantId);
        } catch (error) {
          console.error("Error deleting old assistant message:", error);
        }
      }

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

        if (savedMessage) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === newAssistantMessage.id ? { ...m, id: savedMessage.id } : m
            )
          );
        }
      } catch (error) {
        console.error("Error saving regenerated message:", error);
      }

      await trackAnalyticsEvent({
        chat_instance_id: chatInstance.id,
        session_id: sessionId,
        event_type: "message_sent",
        metadata: { regenerated: true },
      });
    } catch (error) {
      console.error("Error regenerating message:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive",
      });
      setMessages(originalMessages);
    } finally {
      setSending(false);
    }
  }, [chatInstance, sessionId, messages, toast]);

  const handleResetSession = useCallback(async () => {
    if (!chatInstance || !user) return;

    const sessionManager = new SessionManager(chatInstance.id, user.id);
    const newSessionId = await sessionManager.createNewSession();
    setSessionId(newSessionId);
    setViewTracked(false);

    const branding = chatInstance.custom_branding;
    const uxConfig = getUXConfig(branding);

    if (!uxConfig.useLandingPageMode) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: branding?.welcomeMessage || "Hi! How can I help you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);

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

    const welcomeScreenConfig = getWelcomeScreen(branding);
    if (uxConfig.useLandingPageMode) {
      setChatMode("landing");
    } else if (welcomeScreenConfig.enabled) {
      setChatMode("welcome");
    } else {
      setChatMode("chat");
    }

    toast({
      title: "Session reset",
      description: "Started a new conversation",
    });
  }, [chatInstance, user, toast]);

  const handleSessionSelect = useCallback(
    (newSessionId: string) => {
      if (!chatInstance || !user) return;
      const sessionManager = new SessionManager(chatInstance.id, user.id);
      sessionManager.switchSession(newSessionId);
      setSessionId(newSessionId);

      toast({
        title: "Session switched",
        description: "Loaded previous conversation",
      });
    },
    [chatInstance, user, toast]
  );

  const handleCopyMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        setCopiedMessageId(messageId);
        toast({ title: "Copied to clipboard", description: "Message copied successfully" });
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch {
        toast({ title: "Failed to copy", description: "Could not copy message to clipboard", variant: "destructive" });
      }
    },
    [toast]
  );

  const handleCopyCode = useCallback(
    async (code: string, blockId: string) => {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedCodeBlock(blockId);
        toast({ title: "Copied to clipboard", description: "Code copied successfully" });
        setTimeout(() => setCopiedCodeBlock(null), 2000);
      } catch {
        toast({ title: "Failed to copy", description: "Could not copy code to clipboard", variant: "destructive" });
      }
    },
    [toast]
  );

  return {
    messages,
    input,
    setInput,
    sending,
    sessionId,
    chatMode,
    isTypingPrompt,
    viewTracked,
    handleSend,
    typeAndSend,
    handleRegenerate,
    handleResetSession,
    handleSessionSelect,
    handleCopyMessage,
    handleCopyCode,
    copiedMessageId,
    copiedCodeBlock,
    showScrollButton,
    scrollToBottom,
    messagesEndRef,
  };
}
