import { useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2, ArrowLeft, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    const loadSessions = async () => {
      try {
        let query = supabase
          .from("chat_messages")
          .select("session_id, created_at, content, role")
          .eq("chat_instance_id", chatInstanceId)
          .order("created_at", { ascending: true });

        // Filter sessions based on user type
        if (!userId && !isOwner) {
          // Anonymous user - only show their local session
          const chatKey = routeId || chatInstanceId;
          const localSessionId = localStorage.getItem(`chat_session:${chatKey}`);
          if (localSessionId) {
            query = query.eq("session_id", localSessionId);
          } else {
            // No local session yet
            setLoading(false);
            return;
          }
        } else if (userId && !isOwner) {
          // Authenticated user (not owner) - filter by their claimed sessions
          const { data: userSessionData } = await supabase
            .from("user_sessions")
            .select("session_id")
            .eq("user_id", userId)
            .eq("chat_instance_id", chatInstanceId);

          const claimedSessionIds = userSessionData?.map(s => s.session_id) || [];
          
          // Show sessions that are either:
          // 1. In localStorage (current device)
          // 2. Claimed by this user (from any device)
          const chatKey = routeId || chatInstanceId;
          const localSessionId = localStorage.getItem(`chat_session:${chatKey}`);
          const sessionIdsToShow = localSessionId
            ? [...new Set([...claimedSessionIds, localSessionId])]
            : claimedSessionIds;

          if (sessionIdsToShow.length > 0) {
            query = query.in("session_id", sessionIdsToShow);
          } else {
            // User has no sessions yet
            setLoading(false);
            return;
          }
        }

        const { data, error } = await query;

        if (error) throw error;

        // Group messages by session_id
        const sessionMap = new Map<string, Session>();
        
        data?.forEach((msg) => {
          if (!sessionMap.has(msg.session_id)) {
            // Initialize session - preview will be set later
            sessionMap.set(msg.session_id, {
              session_id: msg.session_id,
              first_message_time: msg.created_at,
              message_count: 1,
              preview: "New conversation", // Default, will be replaced if user message found
            });
          } else {
            const session = sessionMap.get(msg.session_id)!;
            session.message_count += 1;
          }
          
          // Always try to set preview from first user message
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

        setSessions(sessionList);
      } catch (error) {
        console.error("Error loading sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [chatInstanceId, userId, isOwner]);

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
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("session_id", sessionToDelete)
        .eq("chat_instance_id", chatInstanceId);

      if (error) throw error;

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
                      {isOwner && (
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
