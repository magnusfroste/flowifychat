import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

interface ChatInstance {
  id: string;
  name: string;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [chatInstance, setChatInstance] = useState<ChatInstance | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const loadChatInstance = async () => {
      if (!id) {
        navigate("/dashboard");
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("chat_instances")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        setChatInstance(data as unknown as ChatInstance);
        
        // Add welcome message
        const branding = data.custom_branding as unknown as ChatInstance["custom_branding"];
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: branding.welcomeMessage,
            timestamp: new Date(),
          },
        ]);
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
  }, [id, navigate, toast]);

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

    try {
      // Send to n8n webhook
      const response = await fetch(chatInstance.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sendMessage",
          sessionId: sessionId,
          chatInput: userMessage.content,
        }),
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
            
            // Accumulate content from streaming items
            if (parsed.type === 'item' && parsed.content) {
              assistantContent += parsed.content;
            }
            
            // Also handle direct output/content in each line
            if (parsed.output || parsed.content) {
              assistantContent += parsed.output || parsed.content;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chatInstance) return null;

  return (
    <div
      className="min-h-screen bg-gradient-subtle"
      style={{
        // Apply custom branding
        "--chat-primary": chatInstance.custom_branding.primaryColor,
        "--chat-accent": chatInstance.custom_branding.accentColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">
                {chatInstance.custom_branding.chatTitle}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 mb-32">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <Card
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                <div className="p-4">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </Card>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <Card className="bg-card">
                <div className="p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type your message..."
                className="bg-background"
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="bg-primary hover:bg-primary-glow"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
