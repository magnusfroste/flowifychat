import { useEffect, useState } from "react";
import { MessageSquare, Plus, Settings, ChevronRight, Trash2, Activity } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { AppSidebarHeader } from "./AppSidebarHeader";
import { AppSidebarFooter } from "./AppSidebarFooter";
import { UserPlan } from "@/hooks/useUserPlan";

interface ChatInstance {
  id: string;
  name: string;
  slug: string | null;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
  custom_branding: {
    primaryColor: string;
    chatTitle: string;
  };
  analytics?: {
    total_views: number;
    unique_views: number;
    total_messages: number;
    active_sessions: number;
  };
}

interface Session {
  session_id: string;
  first_message_time: string;
  message_count: number;
  preview: string;
}

interface AppSidebarProps {
  mode: 'dashboard' | 'chat' | 'edit';
  currentChatId?: string;
  currentSessionId?: string;
  selectedChatId?: string | null;
  onSessionSelect?: (sessionId: string) => void;
  onNewSession?: () => void;
  onChatSelect?: (chatId: string | null) => void;
  userEmail: string | undefined;
  userPlan: UserPlan | null;
  onUpgrade: () => void;
  onLogout: () => void;
  canCreateMore: boolean;
}

export function AppSidebar({
  mode,
  currentChatId,
  currentSessionId,
  selectedChatId,
  onSessionSelect,
  onNewSession,
  onChatSelect,
  userEmail,
  userPlan,
  onUpgrade,
  onLogout,
  canCreateMore,
}: AppSidebarProps) {
  const navigate = useNavigate();
  const { open: sidebarOpen } = useSidebar();
  const { toast } = useToast();
  const [chatInstances, setChatInstances] = useState<ChatInstance[]>([]);
  const [sessions, setSessions] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(currentChatId || null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{ chatId: string; sessionId: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load chat instances
  useEffect(() => {
    const loadChatInstances = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("chat_instances")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setChatInstances(data as unknown as ChatInstance[]);
      } catch (error) {
        console.error("Error loading chat instances:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChatInstances();
  }, []);

  // Load sessions for chat mode or expanded chat in dashboard mode
  useEffect(() => {
    const loadSessions = async (chatId: string) => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("session_id, created_at, content")
          .eq("chat_instance_id", chatId)
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

        // Include empty sessions from SessionManager
        const { data: { user } } = await supabase.auth.getUser();
        const manager = new SessionManager(chatId, user?.id || null);
        const visibleSessionIds = await manager.getAllVisibleSessions();

        for (const id of visibleSessionIds) {
          if (!sessionMap.has(id)) {
            sessionMap.set(id, {
              session_id: id,
              first_message_time: new Date().toISOString(),
              message_count: 0,
              preview: "New conversation",
            });
          }
        }

        // Ensure currentSessionId is included
        if (currentSessionId && !sessionMap.has(currentSessionId)) {
          sessionMap.set(currentSessionId, {
            session_id: currentSessionId,
            first_message_time: new Date().toISOString(),
            message_count: 0,
            preview: "New conversation",
          });
        }

        const sessionList = Array.from(sessionMap.values()).sort(
          (a, b) =>
            new Date(b.first_message_time).getTime() -
            new Date(a.first_message_time).getTime()
        );

        setSessions((prev) => ({ ...prev, [chatId]: sessionList }));
      } catch (error) {
        console.error("Error loading sessions:", error);
      }
    };

    if (mode === 'chat' && currentChatId) {
      loadSessions(currentChatId);
    }
    
    if (mode === 'edit' && expandedChatId && !sessions[expandedChatId]) {
      loadSessions(expandedChatId);
    }
  }, [mode, currentChatId, expandedChatId, currentSessionId]);

  // Subscribe to real-time inserts for chat mode
  useEffect(() => {
    if (mode !== 'chat' || !currentChatId) return;

    const channel = supabase
      .channel(`app_sidebar_${currentChatId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `chat_instance_id=eq.${currentChatId}` 
        },
        () => {
          // Reload sessions when new message arrives
          const loadSessions = async () => {
            try {
              const { data, error } = await supabase
                .from("chat_messages")
                .select("session_id, created_at, content")
                .eq("chat_instance_id", currentChatId)
                .order("created_at", { ascending: true });

              if (error) throw error;

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

              const { data: { user } } = await supabase.auth.getUser();
              const manager = new SessionManager(currentChatId, user?.id || null);
              const visibleSessionIds = await manager.getAllVisibleSessions();

              for (const id of visibleSessionIds) {
                if (!sessionMap.has(id)) {
                  sessionMap.set(id, {
                    session_id: id,
                    first_message_time: new Date().toISOString(),
                    message_count: 0,
                    preview: "New conversation",
                  });
                }
              }

              if (currentSessionId && !sessionMap.has(currentSessionId)) {
                sessionMap.set(currentSessionId, {
                  session_id: currentSessionId,
                  first_message_time: new Date().toISOString(),
                  message_count: 0,
                  preview: "New conversation",
                });
              }

              const sessionList = Array.from(sessionMap.values()).sort(
                (a, b) =>
                  new Date(b.first_message_time).getTime() -
                  new Date(a.first_message_time).getTime()
              );

              setSessions((prev) => ({ ...prev, [currentChatId]: sessionList }));
            } catch (error) {
              console.error("Error reloading sessions:", error);
            }
          };
          
          loadSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, currentChatId, currentSessionId]);

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

  const handleDeleteClick = (chatId: string, sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete({ chatId, sessionId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("session_id", sessionToDelete.sessionId)
        .eq("chat_instance_id", sessionToDelete.chatId);

      if (error) throw error;

      setSessions((prev) => ({
        ...prev,
        [sessionToDelete.chatId]: prev[sessionToDelete.chatId]?.filter(
          (s) => s.session_id !== sessionToDelete.sessionId
        ) || [],
      }));
      
      if (sessionToDelete.sessionId === currentSessionId && onNewSession) {
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

  const handleCreateNew = () => {
    if (canCreateMore) {
      navigate("/chat/new");
    } else {
      onUpgrade();
    }
  };

  // CHAT MODE: Flat conversation history for single chat
  if (mode === 'chat' && currentChatId) {
    const currentSessions = sessions[currentChatId] || [];
    
    return (
      <>
        <Sidebar collapsible="icon" className="border-r border-border">
          <AppSidebarHeader />
          
          <div className="px-4 py-3">
            <Button
              onClick={onNewSession}
              className="w-full justify-start"
              variant="default"
              size={sidebarOpen ? "default" : "icon"}
            >
              <Plus className={sidebarOpen ? "mr-2 h-4 w-4" : "h-4 w-4"} />
              {sidebarOpen && "New Session"}
            </Button>
          </div>

          <SidebarContent>
            <SidebarGroup>
              {sidebarOpen && <SidebarGroupLabel>Conversations</SidebarGroupLabel>}
              
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
                  ) : currentSessions.length === 0 ? (
                    sidebarOpen && (
                      <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        No conversations yet
                      </div>
                    )
                  ) : (
                    currentSessions.map((session) => (
                      <SidebarMenuItem key={session.session_id}>
                        <div className="relative group">
                          <SidebarMenuButton
                            onClick={() => onSessionSelect?.(session.session_id)}
                            isActive={session.session_id === currentSessionId}
                            className="w-full pr-8"
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteClick(currentChatId, session.session_id, e)}
                            title="Delete conversation"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <AppSidebarFooter
            userEmail={userEmail}
            userPlan={userPlan}
            onUpgrade={onUpgrade}
            onLogout={onLogout}
          />
        </Sidebar>

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
      </>
    );
  }

  // DASHBOARD/EDIT MODE: Shows all chat instances
  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border">
        <AppSidebarHeader />

        <SidebarContent className="flex flex-col">
          <div className="px-4 py-3">
            <Button
              onClick={handleCreateNew}
              className="w-full justify-start"
              variant={canCreateMore ? "default" : "outline"}
              size={sidebarOpen ? "default" : "icon"}
            >
              <Plus className={sidebarOpen ? "mr-2 h-4 w-4" : "h-4 w-4"} />
              {sidebarOpen && (canCreateMore ? "New Chat" : "Upgrade to Create")}
            </Button>
          </div>

          <SidebarGroup className="flex-1 px-0">
            <SidebarGroupContent className="flex flex-col h-full">
              {chatInstances.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  {sidebarOpen ? (
                    <>
                      <p className="text-sm text-muted-foreground">No chat instances yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Create your first one!</p>
                    </>
                  ) : (
                    <MessageSquare className="h-4 w-4 text-muted-foreground mx-auto" />
                  )}
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="px-2 py-2 space-y-1">
                    <Button
                      onClick={() => onChatSelect?.(null)}
                      variant={selectedChatId === null ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      size={sidebarOpen ? "default" : "icon"}
                    >
                      <MessageSquare className={sidebarOpen ? "mr-2 h-4 w-4" : "h-4 w-4"} />
                      {sidebarOpen && "All Chats"}
                    </Button>

                    {chatInstances.map((chat) => {
                      const hasActivity = chat.analytics && (chat.analytics.unique_views > 0 || chat.analytics.total_messages > 0);
                      
                      return (
                        <div key={chat.id} className="relative group">
                          <Link
                            to={`/chat/${chat.slug || chat.id}`}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left",
                              !sidebarOpen && "justify-center px-2",
                              selectedChatId === chat.id
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-accent/10 text-foreground"
                            )}
                          >
                            {sidebarOpen ? (
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full shrink-0",
                                  chat.is_active ? "bg-green-500" : "bg-muted"
                                )}
                              />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}

                            {sidebarOpen && (
                              <>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{chat.name}</p>
                                  {chat.analytics && (
                                    <p className="text-xs text-muted-foreground">
                                      {chat.analytics.total_messages} message{chat.analytics.total_messages !== 1 ? "s" : ""}
                                    </p>
                                  )}
                                </div>

                                {hasActivity && (
                                  <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                                )}
                              </>
                            )}
                          </Link>

                          {sidebarOpen && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/chat/${chat.id}/edit`);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-accent opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity"
                              aria-label="Chat settings"
                            >
                              <Settings className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <AppSidebarFooter
          userEmail={userEmail}
          userPlan={userPlan}
          onUpgrade={onUpgrade}
          onLogout={onLogout}
        />
      </Sidebar>
    </>
  );
}
