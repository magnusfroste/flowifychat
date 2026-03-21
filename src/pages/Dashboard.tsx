import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getChatAnalytics, getChatUserCount } from "@/lib/analytics";
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
import { ArrowLeft, MoreVertical, Trash2, Eye, Loader2, Copy, Check, Share2, Activity, Users, Plus, Edit, Lock, Globe } from "lucide-react";
import { getShareableUrl } from "@/lib/slugUtils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatUsersList } from "@/components/ChatUsersList";

import type { DashboardChatInstance } from "@/types/chat";

type ChatInstance = DashboardChatInstance;

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatInstances, setChatInstances] = useState<ChatInstance[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [usersListOpen, setUsersListOpen] = useState(false);
  const [selectedChatForUsers, setSelectedChatForUsers] = useState<ChatInstance | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await loadChatInstances(session.user.id);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Set up real-time subscription for chat instances
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-instances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_instances',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (user?.id) {
            loadChatInstances(user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadChatInstances = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_instances")
        .select("*")
        .eq('user_id', userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch analytics for each chat instance
      const instancesWithAnalytics = await Promise.all(
        (data || []).map(async (instance) => {
          const analytics = await getChatAnalytics(instance.id);
          
          // For authenticated chats, get actual user count from user_sessions
          // For public chats, use active_sessions from analytics
          const userCount = instance.chat_type === 'authenticated'
            ? await getChatUserCount(instance.id)
            : analytics.active_sessions || 0;
          
          return {
            ...instance,
            analytics: {
              total_views: analytics.total_views || 0,
              unique_views: analytics.unique_views || 0,
              total_messages: analytics.total_messages || 0,
              active_sessions: userCount,
            },
          };
        })
      );

      setChatInstances(instancesWithAnalytics as unknown as ChatInstance[]);
    } catch (error: any) {
      console.error("Error loading chat instances:", error);
      toast({
        title: "Error",
        description: "Failed to load chat instances",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleCopyLink = (slug: string, chatId: string) => {
    navigator.clipboard.writeText(getShareableUrl(slug));
    setCopiedId(chatId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Link copied!",
      description: "Share link copied to clipboard",
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("chat_instances")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Chat instance has been removed.",
      });

      setChatInstances((prev) => prev.filter((chat) => chat.id !== deletingId));
    } catch (error: any) {
      console.error("Error deleting chat instance:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat instance",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "Come back soon!",
    });
  };

  const handleViewUsers = (chat: ChatInstance) => {
    setSelectedChatForUsers(chat);
    setUsersListOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const selectedChat = selectedChatId
    ? chatInstances.find((c) => c.id === selectedChatId)
    : null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-subtle">
        {/* Sidebar */}
        <AppSidebar
          mode="dashboard"
          selectedChatId={selectedChatId}
          onChatSelect={setSelectedChatId}
          userEmail={user?.email}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="lg:hidden" />
                  {selectedChat && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedChatId(null)}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to All
                      </Button>
                      <div className="h-4 w-px bg-border" />
                      <h2 className="text-lg font-semibold">{selectedChat.name}</h2>
                    </>
                  )}
                  {!selectedChat && (
                    <h1 className="text-xl font-bold">Your Chat Interfaces</h1>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">{selectedChat ? (
            // Selected Chat View - Show only the selected chat card (larger)
            <div className="max-w-3xl mx-auto">
              <Card className="border-2 border-primary/30 hover:border-primary/50 transition-all shadow-glow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl">{selectedChat.name}</CardTitle>
                        {selectedChat.chat_type === 'public' ? (
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <CardDescription className="text-base">
                        {(selectedChat.custom_branding as ChatInstance["custom_branding"]).chatTitle}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/chat/${selectedChat.id}`} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            Open Chat
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/chat/${selectedChat.id}/edit`} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => handleDeleteClick(selectedChat.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Share Link */}
                  {selectedChat.slug && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Share2 className="h-4 w-4" />
                        <span className="font-medium">Public Share Link</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono truncate text-foreground">
                            {getShareableUrl(selectedChat.slug)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(selectedChat.slug!, selectedChat.id)}
                        >
                          {copiedId === selectedChat.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Analytics */}
                  {selectedChat.analytics && (
                    <div className="bg-primary/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Activity className="h-4 w-4" />
                        <span className="font-medium">Analytics</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-foreground">
                            {selectedChat.analytics.unique_views}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                            <Eye className="h-3 w-3" />
                            Views
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-foreground">
                            {selectedChat.analytics.total_messages}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                            <Activity className="h-3 w-3" />
                            Messages
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-foreground">
                            {selectedChat.analytics.active_sessions}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            Users
                          </div>
                          {selectedChat.chat_type === 'authenticated' && selectedChat.analytics.active_sessions > 0 && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-xs h-auto p-0 mt-1"
                              onClick={() => handleViewUsers(selectedChat)}
                            >
                              View Users
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedChat.is_active ? "default" : "secondary"}>
                      {selectedChat.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Created {formatDistanceToNow(new Date(selectedChat.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // All Chats View - Show grid of all chats
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Manage and create beautiful chat experiences for your n8n workflows
                </p>
              </div>

              {/* Create New Button */}
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
                    const branding = chat.custom_branding as ChatInstance["custom_branding"];
                    return (
                      <Card
                        key={chat.id}
                        className="group hover:border-primary/50 transition-all hover:shadow-glow"
                      >
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
                              <CardDescription className="text-sm">{branding.chatTitle}</CardDescription>
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
                                className={
                                  chat.is_active
                                    ? "bg-primary/20 text-primary border-primary/30"
                                    : ""
                                }
                              >
                                {chat.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>

                            {/* Created Date */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Created</span>
                              <span className="text-sm">
                                {formatDistanceToNow(new Date(chat.created_at), {
                                  addSuffix: true,
                                })}
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
          )}
        </div>
      </main>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this chat instance. This action cannot be
                undone.
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
    </SidebarProvider>
  );
};

export default Dashboard;
