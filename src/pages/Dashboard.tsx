import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getChatAnalytics } from "@/lib/analytics";
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
import { LogOut, MessageSquare, ExternalLink, MoreVertical, Trash2, Eye, Loader2, Copy, Check, Share2, Activity, Users } from "lucide-react";
import { getShareableUrl } from "@/lib/slugUtils";
import { useToast } from "@/hooks/use-toast";
import { CreateChatDialog } from "@/components/CreateChatDialog";
import { EditChatDialog } from "@/components/EditChatDialog";
import { formatDistanceToNow } from "date-fns";

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

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatInstances, setChatInstances] = useState<ChatInstance[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
      await loadChatInstances();
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
          loadChatInstances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadChatInstances = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_instances")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch analytics for each chat instance
      const instancesWithAnalytics = await Promise.all(
        (data || []).map(async (instance) => {
          const analytics = await getChatAnalytics(instance.id);
          return {
            ...instance,
            analytics: {
              total_views: analytics.total_views || 0,
              unique_views: analytics.unique_views || 0,
              total_messages: analytics.total_messages || 0,
              active_sessions: analytics.active_sessions || 0,
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

  const handleEditClick = (id: string) => {
    setEditingId(id);
    setEditDialogOpen(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold">ChatFlow</span>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Chat Interfaces</h1>
          <p className="text-muted-foreground">
            Manage and create beautiful chat experiences for your n8n workflows
          </p>
        </div>

        {/* Create New Button */}
        <Card className="mb-8 border-dashed border-2 border-primary/30 bg-primary/5 hover:border-primary/50 transition-colors">
          <CardContent className="flex items-center justify-center py-12">
            <CreateChatDialog onChatCreated={loadChatInstances} />
          </CardContent>
        </Card>

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
                        <CardTitle className="truncate text-lg mb-2">
                          {chat.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {branding.chatTitle}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              to={`/chat/${chat.id}`}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Open Chat
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleEditClick(chat.id)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Edit
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
                                <MessageSquare className="h-3 w-3" />
                                Messages
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-foreground">
                                {chat.analytics.active_sessions}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                <Users className="h-3 w-3" />
                                Sessions
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status
                        </span>
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Created
                        </span>
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(chat.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-border">
                        <Button
                          asChild
                          className="w-full bg-primary hover:bg-primary-glow"
                        >
                          <Link to={`/chat/${chat.id}`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Open Chat
                          </Link>
                        </Button>
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
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No chat interfaces yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first chat interface to get started
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="secondary">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Documentation
              </Button>
            </div>
          </div>
        )}

        {/* Edit Chat Dialog */}
        {editingId && (
          <EditChatDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            chatId={editingId}
            onChatCreated={loadChatInstances}
          />
        )}

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
      </div>
    </div>
  );
};

export default Dashboard;
