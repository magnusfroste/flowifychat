import { useEffect, useState } from "react";
import { MessageSquare, Plus, Settings, ChevronRight, Trash2 } from "lucide-react";
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSidebarHeader } from "./DashboardSidebarHeader";
import { DashboardSidebarFooter } from "./DashboardSidebarFooter";
import { UserPlan } from "@/hooks/useUserPlan";
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
}

interface Session {
  session_id: string;
  first_message_time: string;
  message_count: number;
  preview: string;
}

interface UnifiedAdminSidebarProps {
  currentChatId: string;
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onChatSelect: (chatId: string) => void;
  userEmail: string | undefined;
  userPlan: UserPlan | null;
  onUpgrade: () => void;
  onLogout: () => void;
  canCreateMore: boolean;
}

export function UnifiedAdminSidebar({
  currentChatId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onChatSelect,
  userEmail,
  userPlan,
  onUpgrade,
  onLogout,
  canCreateMore,
}: UnifiedAdminSidebarProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chatInstances, setChatInstances] = useState<ChatInstance[]>([]);
  const [sessions, setSessions] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(currentChatId);
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

  // Load sessions for expanded chat
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

    if (expandedChatId && !sessions[expandedChatId]) {
      loadSessions(expandedChatId);
    }
  }, [expandedChatId, sessions]);

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

  const handleChatClick = (chat: ChatInstance) => {
    const targetPath = `/chat/${chat.slug || chat.id}`;
    if (expandedChatId === chat.id) {
      // Already expanded, just navigate
      navigate(targetPath);
    } else {
      // Expand and navigate
      setExpandedChatId(chat.id);
      navigate(targetPath);
    }
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

      // Remove from local state
      setSessions((prev) => ({
        ...prev,
        [sessionToDelete.chatId]: prev[sessionToDelete.chatId]?.filter(
          (s) => s.session_id !== sessionToDelete.sessionId
        ) || [],
      }));
      
      // If deleted current session, start new one
      if (sessionToDelete.sessionId === currentSessionId) {
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
      navigate("/dashboard?new=true");
    } else {
      onUpgrade();
    }
  };

  return (
    <>
      <Sidebar className="border-r border-border">
        <DashboardSidebarHeader />

        <SidebarContent className="flex flex-col">
          {/* Primary Action */}
          <div className="px-4 py-3">
            <Button
              onClick={handleCreateNew}
              className="w-full justify-start"
              variant={canCreateMore ? "default" : "outline"}
            >
              <Plus className="mr-2 h-4 w-4" />
              {canCreateMore ? "New Chat" : "Upgrade to Create"}
            </Button>
          </div>

          {/* Chat Instances with Nested Sessions */}
          <SidebarGroup className="flex-1 px-0">
            <SidebarGroupLabel className="px-4">My Chats</SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col h-full">
              <SidebarMenu>
                {loading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="px-4 py-3">
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </>
                ) : chatInstances.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                    No chat instances yet
                  </div>
                ) : (
                  chatInstances.map((chat) => (
                    <Collapsible
                      key={chat.id}
                      open={expandedChatId === chat.id}
                      onOpenChange={(open) => {
                        setExpandedChatId(open ? chat.id : null);
                      }}
                    >
                      <SidebarMenuItem>
                        <div className="group relative">
                          {/* Chat Instance Row */}
                          <div className="flex items-center gap-1 px-2">
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <ChevronRight
                                  className={`h-4 w-4 transition-transform ${
                                    expandedChatId === chat.id ? "rotate-90" : ""
                                  }`}
                                />
                              </Button>
                            </CollapsibleTrigger>
                            
                            <SidebarMenuButton
                              onClick={() => handleChatClick(chat)}
                              isActive={currentChatId === chat.id}
                              className="flex-1"
                            >
                              <div
                                className={`h-2 w-2 rounded-full flex-shrink-0 ${
                                  chat.is_active ? "bg-green-500" : "bg-muted"
                                }`}
                              />
                              <span className="truncate font-medium">{chat.name}</span>
                            </SidebarMenuButton>

                            {/* Settings Icon */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/chat/${chat.id}/edit`);
                              }}
                            >
                              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>

                          {/* Nested Sessions */}
                          <CollapsibleContent>
                            <div className="ml-8 mt-1 space-y-1">
                              {sessions[chat.id]?.length > 0 ? (
                                <>
                                  {sessions[chat.id].map((session) => (
                                    <div key={session.session_id} className="relative group/session">
                                      <SidebarMenuButton
                                        onClick={() => {
                                          onChatSelect(chat.id);
                                          onSessionSelect(session.session_id);
                                          navigate(`/chat/${chat.slug || chat.id}`);
                                        }}
                                        isActive={
                                          currentChatId === chat.id &&
                                          currentSessionId === session.session_id
                                        }
                                        className="w-full pl-2 pr-8 text-xs"
                                      >
                                        <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                        <div className="flex flex-col items-start flex-1 min-w-0">
                                          <span className="truncate w-full">
                                            {session.preview}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {formatTimestamp(session.first_message_time)} •{" "}
                                            {session.message_count} msgs
                                          </span>
                                        </div>
                                      </SidebarMenuButton>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 opacity-0 group-hover/session:opacity-100 transition-opacity"
                                        onClick={(e) => handleDeleteClick(chat.id, session.session_id, e)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      onChatSelect(chat.id);
                                      onNewSession();
                                      navigate(`/chat/${chat.slug || chat.id}`);
                                    }}
                                    className="w-full justify-start text-xs text-muted-foreground hover:text-foreground pl-2"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    New Session
                                  </Button>
                                </>
                              ) : (
                                <div className="px-2 py-2 text-xs text-muted-foreground">
                                  No sessions yet
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </SidebarMenuItem>
                    </Collapsible>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <DashboardSidebarFooter
          userEmail={userEmail}
          userPlan={userPlan}
          onUpgrade={onUpgrade}
          onLogout={onLogout}
        />
      </Sidebar>

      {/* Delete Confirmation Dialog */}
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
