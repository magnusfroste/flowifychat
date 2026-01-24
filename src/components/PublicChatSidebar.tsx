/**
 * Public Chat Sidebar Component
 * Lightweight sidebar for anonymous users using localStorage for history
 */

import { useState, useEffect } from "react";
import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import flowifyLogo from "@/assets/logo-concept-1-flowing-bubble.png";
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

interface LocalSession {
  id: string;
  preview: string;
  timestamp: number;
  messageCount: number;
}

interface PublicChatSidebarProps {
  chatInstanceId: string;
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  logoUrl?: string | null;
  avatarUrl?: string | null;
  chatTitle?: string;
}

// localStorage key for storing sessions
const getStorageKey = (chatInstanceId: string) => 
  `flowify_public_sessions_${chatInstanceId}`;

export function getLocalSessions(chatInstanceId: string): LocalSession[] {
  try {
    const stored = localStorage.getItem(getStorageKey(chatInstanceId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveLocalSession(
  chatInstanceId: string, 
  sessionId: string, 
  preview: string,
  messageCount: number
) {
  const sessions = getLocalSessions(chatInstanceId);
  const existingIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (existingIndex >= 0) {
    sessions[existingIndex].preview = preview;
    sessions[existingIndex].timestamp = Date.now();
    sessions[existingIndex].messageCount = messageCount;
  } else {
    sessions.unshift({
      id: sessionId,
      preview,
      timestamp: Date.now(),
      messageCount,
    });
  }
  
  // Keep only last 20 sessions
  const trimmed = sessions.slice(0, 20);
  localStorage.setItem(getStorageKey(chatInstanceId), JSON.stringify(trimmed));
}

export function deleteLocalSession(chatInstanceId: string, sessionId: string) {
  const sessions = getLocalSessions(chatInstanceId);
  const filtered = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem(getStorageKey(chatInstanceId), JSON.stringify(filtered));
}

export function PublicChatSidebar({
  chatInstanceId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  logoUrl,
  avatarUrl,
  chatTitle,
}: PublicChatSidebarProps) {
  const { open: sidebarOpen } = useSidebar();
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Load sessions from localStorage
  useEffect(() => {
    setSessions(getLocalSessions(chatInstanceId));
  }, [chatInstanceId]);

  // Refresh sessions when component mounts or currentSessionId changes
  useEffect(() => {
    const handleStorageChange = () => {
      setSessions(getLocalSessions(chatInstanceId));
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also refresh on focus (in case another tab updated)
    const handleFocus = () => setSessions(getLocalSessions(chatInstanceId));
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [chatInstanceId]);

  const formatTimestamp = (timestamp: number) => {
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

  const handleDeleteConfirm = () => {
    if (!sessionToDelete) return;
    
    deleteLocalSession(chatInstanceId, sessionToDelete);
    setSessions(getLocalSessions(chatInstanceId));
    
    if (sessionToDelete === currentSessionId) {
      onNewSession();
    }
    
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  // Expose a refresh method via custom event
  useEffect(() => {
    const handleRefresh = () => {
      setSessions(getLocalSessions(chatInstanceId));
    };
    
    window.addEventListener(`refresh_public_sidebar_${chatInstanceId}`, handleRefresh);
    return () => {
      window.removeEventListener(`refresh_public_sidebar_${chatInstanceId}`, handleRefresh);
    };
  }, [chatInstanceId]);

  return (
    <Sidebar className={sidebarOpen ? "w-64" : "w-14"} collapsible="icon">
      {/* Branded Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <img 
              src={logoUrl || avatarUrl || flowifyLogo} 
              alt={chatTitle || "Flowify"} 
              className="h-8 w-8 rounded-lg object-contain flex-shrink-0"
            />
            {chatTitle && (
              <span className="text-sm font-semibold text-foreground truncate">
                {chatTitle}
              </span>
            )}
          </div>
        )}
        <SidebarTrigger className={!sidebarOpen ? "mx-auto" : ""} />
      </div>

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

      <SidebarContent>
        <SidebarGroup>
          {sidebarOpen && (
            <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          )}
          
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.length === 0 ? (
                sidebarOpen && (
                  <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                    No conversations yet
                  </div>
                )
              ) : (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <div className="relative group">
                      <SidebarMenuButton
                        onClick={() => onSessionSelect(session.id)}
                        isActive={session.id === currentSessionId}
                        className="w-full pr-8"
                        title={sidebarOpen ? undefined : session.preview}
                      >
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        {sidebarOpen && (
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="text-xs font-medium truncate w-full">
                              {session.preview || "New conversation"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(session.timestamp)} •{" "}
                              {session.messageCount} messages
                            </span>
                          </div>
                        )}
                      </SidebarMenuButton>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 min-h-[32px] min-w-[32px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteClick(session.id, e)}
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Subtle tagline */}
      {sidebarOpen && !logoUrl && !avatarUrl && (
        <div className="mt-auto p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center opacity-50">
            Let it Flowify
          </p>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this conversation from your local history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
