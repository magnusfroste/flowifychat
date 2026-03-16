import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreVertical, Trash2, Eye, Loader2, Copy, Check, Share2, Activity, Users, Plus, Edit, Lock, Globe } from "lucide-react";
import { getShareableUrl } from "@/lib/slugUtils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { ChatUsersList } from "@/components/ChatUsersList";
import { AdminLayout, type AdminContext } from "@/components/AdminLayout";
import type { AdminChatInstance } from "@/types/adminLayout";

function DashboardContent({ context }: { context: AdminContext }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [usersListOpen, setUsersListOpen] = useState(false);
  const [selectedChatForUsers, setSelectedChatForUsers] = useState<AdminChatInstance | null>(null);
  const { toast } = useToast();

  const { chatInstances, activeView } = context;

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleCopyLink = (slug: string, chatId: string) => {
    navigator.clipboard.writeText(getShareableUrl(slug));
    setCopiedId(chatId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied!", description: "Share link copied to clipboard" });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("chat_instances").delete().eq("id", deletingId);
      if (error) throw error;
      toast({ title: "Deleted", description: "Chat instance has been removed." });
      await context.loadChatInstances();
    } catch (error) {
      console.error("Error deleting chat instance:", error);
      toast({ title: "Error", description: "Failed to delete chat instance", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleViewUsers = (chat: AdminChatInstance) => {
    setSelectedChatForUsers(chat);
    setUsersListOpen(true);
  };

  // Account settings view
  if (activeView === 'settings') {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <p className="text-muted-foreground">Account settings coming soon.</p>
      </div>
    );
  }

  // Overview (default)
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1">Your Chat Interfaces</h1>
          <p className="text-muted-foreground">
            Manage and create beautiful chat experiences for your n8n workflows
          </p>
        </div>

        {/* Create New */}
        <Link to="/chat/new">
          <Card className="mb-6 border-dashed border-2 border-primary/30 bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Create New Chat Interface</h3>
                <p className="text-muted-foreground text-sm">
                  Configure a beautiful chat experience for your workflow
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Chat Instances Grid */}
        {chatInstances.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatInstances.map((chat) => {
              const branding = chat.custom_branding;
              return (
                <Card key={chat.id} className="group hover:border-primary/50 transition-all hover:shadow-glow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="truncate text-lg">{chat.name}</CardTitle>
                          {chat.chat_type === 'public' ? (
                            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <CardDescription className="text-sm">{branding?.chatTitle}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/chat/${chat.id}`} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              Open Chat
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/chat/${chat.id}/edit`} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => handleDeleteClick(chat.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Share Link */}
                      {chat.slug && (
                        <div className="bg-muted/50 rounded-md p-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Share2 className="h-3 w-3" />
                            <span className="font-medium">Public Share Link</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-mono truncate text-foreground">
                                {getShareableUrl(chat.slug)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 shrink-0"
                              onClick={() => handleCopyLink(chat.slug!, chat.id)}
                            >
                              {copiedId === chat.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Analytics */}
                      {chat.analytics && (
                        <div className="bg-primary/5 rounded-md p-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Activity className="h-3 w-3" />
                            <span className="font-medium">Analytics</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-foreground">
                                {chat.analytics.unique_views}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                <Eye className="h-3 w-3" />
                                Views
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-foreground">
                                {chat.analytics.total_messages}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                <Activity className="h-3 w-3" />
                                Messages
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-foreground">
                                {chat.analytics.active_sessions}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                <Users className="h-3 w-3" />
                                Users
                              </div>
                              {chat.chat_type === 'authenticated' && chat.analytics.active_sessions > 0 && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-xs h-auto p-0 mt-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewUsers(chat);
                                  }}
                                >
                                  View
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge
                          variant={chat.is_active ? "default" : "secondary"}
                          className={chat.is_active ? "bg-primary/20 text-primary border-primary/30" : ""}
                        >
                          {chat.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex h-16 w-16 rounded-full bg-primary/10 items-center justify-center mb-4">
              <Plus className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No chat interfaces yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first chat interface to get started
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat instance. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Users List Dialog */}
      {selectedChatForUsers && (
        <ChatUsersList
          chatInstanceId={selectedChatForUsers.id}
          chatName={selectedChatForUsers.name}
          open={usersListOpen}
          onOpenChange={setUsersListOpen}
        />
      )}
    </div>
  );
}

function ChatContent({ context }: { context: AdminContext }) {
  const { selectedChat, activeView } = context;

  if (!selectedChat) return null;

  if (activeView === 'chat') {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Chat Preview</h2>
          <p className="text-sm mb-4">Full chat interface will render here</p>
          <Link to={`/chat/${selectedChat.id}`}>
            <Button>Open Full Chat</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (activeView === 'design' || activeView === 'settings') {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">
            {activeView === 'design' ? 'Design Editor' : 'Chat Settings'}
          </h2>
          <p className="text-sm mb-4">Configuration editor will render here</p>
          <Link to={`/chat/${selectedChat.id}/edit`}>
            <Button>Open Editor</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (activeView === 'sessions') {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Sessions</h2>
          <p className="text-sm">Session management coming soon</p>
        </div>
      </div>
    );
  }

  return null;
}

const Dashboard = () => {
  return (
    <AdminLayout
      renderContent={(context) => {
        if (context.activeTab === 'dashboard') {
          return <DashboardContent context={context} />;
        }
        return <ChatContent context={context} />;
      }}
    />
  );
};

export default Dashboard;
