import { useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2, ArrowLeft, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SessionManager } from "@/lib/SessionManager";
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
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
  isOwner: boolean;
  userId?: string;
  routeId?: string;
  chatSlug?: string | null;
  logoUrl?: string | null;
  avatarUrl?: string | null;
  chatTitle?: string;
}

export function ChatSidebar({
  chatInstanceId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  isOwner,
  userId,
  routeId,
  chatSlug,
  logoUrl,
  avatarUrl,
  chatTitle,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const { open: sidebarOpen } = useSidebar();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadSessions = async () => {
      try {
        const sessionManager = new SessionManager(chatInstanceId, userId!);
        const visibleSessionIds = await sessionManager.getAllSessions();
        
        if (!isMounted) return;
        
        if (visibleSessionIds.length === 0) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("chat_messages")
          .select("session_id, created_at, content, role")
          .eq("chat_instance_id", chatInstanceId)
          .in("session_id", visibleSessionIds)
          .order("created_at", { ascending: true });

        if (!isMounted) return;
        if (error) throw error;

        // Group messages by session_id
        const sessionMap = new Map<string, Session>();
        
        data?.forEach((msg) => {
          if (!sessionMap.has(msg.session_id)) {
            sessionMap.set(msg.session_id, {
              session_id: msg.session_id,
              first_message_time: msg.created_at,
              message_count: 1,
              preview: "New conversation",
            });
          } else {
            const session = sessionMap.get(msg.session_id)!;
            session.message_count += 1;
          }
          
          const session = sessionMap.get(msg.session_id)!;
          if (msg.role === 'user' && session.preview === "New conversation") {
            session.preview = msg.content.substring(0, 50);
          }
        });

        const sessionList = Array.from(sessionMap.values()).sort(
          (a, b) =>
            new Date(b.first_message_time).getTime() -
            new Date(a.first_message_time).getTime()
        );

        if (isMounted) {
          setSessions(sessionList);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading sessions:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSessions();

    // Subscribe to real-time updates for new messages
    const channel = supabase
      .channel(`chat_messages_${chatInstanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_instance_id=eq.${chatInstanceId}`
        },
        () => {
          if (isMounted) {
            loadSessions();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      abortController.abort();
      supabase.removeChannel(channel);
    };
  }, [chatInstanceId, userId, isOwner, routeId, currentSessionId]);

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session =>
    session.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    
    setDeleting(true);
    try {
      // Use SessionManager to properly delete both messages and user_sessions
      const sessionManager = new SessionManager(chatInstanceId, userId!);
      await sessionManager.deleteSession(sessionToDelete);

      // Remove from local state
      setSessions(sessions.filter(s => s.session_id !== sessionToDelete));
      
      // If deleted current session, start new one
      if (sessionToDelete === currentSessionId) {
        onNewSession();
      }

      toast({
        title: "Conversation deleted",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Failed to delete conversation",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };


  return (
    <Sidebar className={sidebarOpen ? "w-64" : "w-14"} collapsible="icon">
      {/* Branded Header - Always visible for authenticated users */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        {sidebarOpen && (logoUrl || avatarUrl) && (
          <img 
            src={logoUrl || avatarUrl || ''} 
            alt={chatTitle || "Chat"} 
            className="h-10 w-auto max-w-[120px] rounded-lg object-contain flex-shrink-0"
          />
        )}
        <SidebarTrigger className={!sidebarOpen ? "mx-auto" : ""} />
      </div>

      {isOwner && sidebarOpen && (
        <div className="p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="w-full justify-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      )}
      
      <div className="px-4 py-3 border-b">
        <Button
          onClick={onNewSession}
          className="w-full justify-start"
          variant="default"
          size={sidebarOpen ? "default" : "icon"}
        >
          <Plus className={sidebarOpen ? "mr-2 h-4 w-4" : "h-4 w-4"} />
          {sidebarOpen && "New Conversation"}
        </Button>
      </div>

      {sidebarOpen && (
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 h-8 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

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
              ) : filteredSessions.length === 0 ? (
                sidebarOpen && (
                  <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                    No matching conversations
                  </div>
                )
              ) : (
                filteredSessions.map((session) => (
                  <SidebarMenuItem key={session.session_id}>
                    <div className="relative group">
                      <SidebarMenuButton
                        onClick={() => onSessionSelect(session.session_id)}
                        isActive={session.session_id === currentSessionId}
                        className="w-full pr-8"
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
                      {(isOwner || userId) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteClick(session.session_id, e)}
                          title="Delete conversation"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages in this conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Sidebar>
  );
}
