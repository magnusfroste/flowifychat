import { useEffect, useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Session {
  session_id: string;
  first_message_time: string;
  message_count: number;
  preview: string;
}

interface ChatSidebarProps {
  chatInstanceId: string;
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
}

export function ChatSidebar({
  chatInstanceId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
}: ChatSidebarProps) {
  const { open: sidebarOpen } = useSidebar();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        // Get all sessions with their first message and message count
        const { data, error } = await supabase
          .from("chat_messages")
          .select("session_id, created_at, content")
          .eq("chat_instance_id", chatInstanceId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Group messages by session_id
        const sessionMap = new Map<string, Session>();
        
        data?.forEach((msg) => {
          if (!sessionMap.has(msg.session_id)) {
            sessionMap.set(msg.session_id, {
              session_id: msg.session_id,
              first_message_time: msg.created_at,
              message_count: 1,
              preview: msg.content.substring(0, 50),
            });
          } else {
            const session = sessionMap.get(msg.session_id)!;
            session.message_count += 1;
          }
        });

        const sessionList = Array.from(sessionMap.values()).sort(
          (a, b) =>
            new Date(b.first_message_time).getTime() -
            new Date(a.first_message_time).getTime()
        );

        setSessions(sessionList);
      } catch (error) {
        console.error("Error loading sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [chatInstanceId]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Sidebar className={sidebarOpen ? "w-64" : "w-14"} collapsible="icon">
      <div className="flex items-center justify-between p-2 border-b">
        <SidebarTrigger />
        {sidebarOpen && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onNewSession}
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          {sidebarOpen && (
            <SidebarGroupLabel>Conversation History</SidebarGroupLabel>
          )}
          
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-2 py-3">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </>
              ) : sessions.length === 0 ? (
                sidebarOpen && (
                  <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                    No conversations yet
                  </div>
                )
              ) : (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.session_id}>
                    <SidebarMenuButton
                      onClick={() => onSessionSelect(session.session_id)}
                      isActive={session.session_id === currentSessionId}
                      className="w-full"
                      title={sidebarOpen ? undefined : session.preview}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      {sidebarOpen && (
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <span className="text-xs font-medium truncate w-full">
                            {session.preview}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(session.first_message_time)} •{" "}
                            {session.message_count} messages
                          </span>
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
