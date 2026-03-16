/**
 * AdminSidebar - Unified left panel for the admin layout.
 * 
 * Dashboard mode: Admin navigation links (Overview, Account Settings)
 * Chat mode: Session list with new conversation, search, delete
 * 
 * Both modes share the same visual style — only the content differs.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  LayoutGrid,
  Settings,
  MessageSquare,
  Palette,
  Wrench,
  Plus,
  Search,
  X,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionManager } from "@/lib/SessionManager";
import type { AdminActiveTab, AdminActiveView } from "@/types/adminLayout";

// --- Types ---

interface Session {
  session_id: string;
  first_message_time: string;
  message_count: number;
  preview: string;
}

interface SidebarLink {
  id: AdminActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AdminSidebarProps {
  activeTab: AdminActiveTab;
  activeView: AdminActiveView;
  onViewChange: (view: AdminActiveView) => void;
  // Chat session props (only used when a chat is selected)
  chatInstanceId?: string;
  userId?: string;
  currentSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onNewSession?: () => void;
}

// --- Constants ---

const dashboardLinks: SidebarLink[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'settings', label: 'Account Settings', icon: Settings },
];


// --- Helpers ---

function formatTimestamp(timestamp: string) {
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
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// --- Sub-components ---

function NavLinks({
  links,
  activeView,
  onViewChange,
}: {
  links: SidebarLink[];
  activeView: AdminActiveView;
  onViewChange: (view: AdminActiveView) => void;
}) {
  return (
    <nav className="px-2 space-y-0.5">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <button
            key={link.id}
            onClick={() => onViewChange(link.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activeView === link.id
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {link.label}
          </button>
        );
      })}
    </nav>
  );
}

function SessionList({
  chatInstanceId,
  userId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
}: {
  chatInstanceId: string;
  userId: string;
  currentSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onNewSession?: () => void;
}) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      try {
        const sessionManager = new SessionManager(chatInstanceId, userId);
        const visibleSessionIds = await sessionManager.getAllSessions();

        if (!isMounted || visibleSessionIds.length === 0) {
          if (isMounted) setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("chat_messages")
          .select("session_id, created_at, content, role")
          .eq("chat_instance_id", chatInstanceId)
          .in("session_id", visibleSessionIds)
          .order("created_at", { ascending: true });

        if (!isMounted || error) return;

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
            sessionMap.get(msg.session_id)!.message_count += 1;
          }
          const session = sessionMap.get(msg.session_id)!;
          if (msg.role === 'user' && session.preview === "New conversation") {
            session.preview = msg.content.substring(0, 50);
          }
        });

        if (isMounted) {
          setSessions(
            Array.from(sessionMap.values()).sort(
              (a, b) => new Date(b.first_message_time).getTime() - new Date(a.first_message_time).getTime()
            )
          );
        }
      } catch (error) {
        console.error("Error loading sessions:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSessions();

    const channel = supabase
      .channel(`admin_sessions_${chatInstanceId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_instance_id=eq.${chatInstanceId}`,
      }, () => { if (isMounted) loadSessions(); })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [chatInstanceId, userId, currentSessionId]);

  const filteredSessions = sessions.filter(s =>
    s.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    setDeleting(true);
    try {
      const sessionManager = new SessionManager(chatInstanceId, userId);
      await sessionManager.deleteSession(sessionToDelete);
      setSessions(prev => prev.filter(s => s.session_id !== sessionToDelete));
      if (sessionToDelete === currentSessionId) onNewSession?.();
      toast({ title: "Conversation deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* New Conversation */}
      <div className="px-2 pb-2">
        <Button
          onClick={async () => {
            setCreatingSession(true);
            try { await onNewSession?.(); } finally { setCreatingSession(false); }
          }}
          className="w-full justify-start"
          variant="default"
          size="sm"
          disabled={creatingSession}
        >
          {creatingSession ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {creatingSession ? "Creating..." : "New Conversation"}
        </Button>
      </div>

      {/* Search */}
      <div className="px-2 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 pr-7 h-8 text-xs"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="px-4 pb-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Conversations
        </span>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="px-2 py-2">
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : filteredSessions.length === 0 ? (
          <div className="px-2 py-6 text-xs text-muted-foreground text-center">
            {sessions.length === 0 ? "No conversations yet" : "No matches"}
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div key={session.session_id} className="relative group">
              <button
                onClick={() => onSessionSelect?.(session.session_id)}
                className={cn(
                  "w-full flex items-start gap-2 px-3 py-2 rounded-md text-left transition-colors pr-8",
                  session.session_id === currentSessionId
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-medium truncate">{session.preview}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTimestamp(session.first_message_time)} · {session.message_count} msg
                  </span>
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setSessionToDelete(session.session_id);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages. This action cannot be undone.
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
    </div>
  );
}

// --- Main Component ---

export function AdminSidebar({
  activeTab,
  activeView,
  onViewChange,
  chatInstanceId,
  userId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
}: AdminSidebarProps) {
  const isDashboard = activeTab === 'dashboard';
  const isChat = !isDashboard;

  return (
    <aside className="w-56 border-r border-border bg-sidebar shrink-0 flex flex-col overflow-hidden">
      <div className="py-3 flex flex-col flex-1 overflow-hidden">
        {isDashboard ? (
          <NavLinks links={dashboardLinks} activeView={activeView} onViewChange={onViewChange} />
        ) : (
          chatInstanceId && userId && (
            <SessionList
              chatInstanceId={chatInstanceId}
              userId={userId}
              currentSessionId={currentSessionId}
              onSessionSelect={(sid) => {
                onSessionSelect?.(sid);
                onViewChange('chat');
              }}
              onNewSession={() => {
                onNewSession?.();
                onViewChange('chat');
              }}
            />
          )
        )}
      </div>
    </aside>
  );
}
