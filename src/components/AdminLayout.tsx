import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getChatAnalytics, getChatUserCount } from "@/lib/analytics";
import { AdminTopHeader } from "@/components/AdminTopHeader";
import { AdminSidebar } from "@/components/AdminSidebar";
import type { AdminChatInstance, AdminActiveTab, AdminActiveView } from "@/types/adminLayout";

interface AdminLayoutProps {
  renderContent?: (context: AdminContext) => React.ReactNode;
}

export interface AdminContext {
  activeTab: AdminActiveTab;
  activeView: AdminActiveView;
  chatInstances: AdminChatInstance[];
  selectedChat: AdminChatInstance | null;
  selectedChatId: string | null;
  user: any;
  loadChatInstances: () => Promise<void>;
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
}

export function AdminLayout({ renderContent }: AdminLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatInstances, setChatInstances] = useState<AdminChatInstance[]>([]);
  const [activeTab, setActiveTab] = useState<AdminActiveTab>('dashboard');
  const [activeView, setActiveView] = useState<AdminActiveView>('overview');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [sessionResetCounter, setSessionResetCounter] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadChatInstances = useCallback(async (userId?: string) => {
    const uid = userId || user?.id;
    if (!uid) return;

    try {
      const { data, error } = await supabase
        .from("chat_instances")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const instancesWithAnalytics = await Promise.all(
        (data || []).map(async (instance) => {
          const analytics = await getChatAnalytics(instance.id);
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
          } as AdminChatInstance;
        })
      );

      setChatInstances(instancesWithAnalytics);
    } catch (error) {
      console.error("Error loading chat instances:", error);
      toast({ title: "Error", description: "Failed to load chat instances", variant: "destructive" });
    }
  }, [user?.id, toast]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      await loadChatInstances(session.user.id);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('admin-chat-instances')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_instances', filter: `user_id=eq.${user.id}` },
        () => { loadChatInstances(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadChatInstances]);

  const handleTabChange = (tab: AdminActiveTab) => {
    if (tab === 'dashboard') {
      setActiveTab('dashboard');
      setActiveView('overview');
      // Keep selectedChatId so dashboard shows config for that chat
    } else {
      setActiveTab(tab);
      setActiveView('chat');
      setSelectedChatId(tab);
      setCurrentSessionId("");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out", description: "Come back soon!" });
  };

  const handleNewChat = () => { navigate("/chat/new"); };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setActiveView('chat');
  };

  const handleNewSession = () => {
    setCurrentSessionId("");
    setSessionResetCounter(c => c + 1);
    setActiveView('chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const selectedChat = selectedChatId
    ? chatInstances.find((c) => c.id === selectedChatId) || null
    : null;

  const context: AdminContext = {
    activeTab,
    activeView,
    chatInstances,
    selectedChat,
    selectedChatId,
    user,
    loadChatInstances,
    currentSessionId,
    onSessionSelect: handleSessionSelect,
    onNewSession: handleNewSession,
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <AdminTopHeader
        chatInstances={chatInstances}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNewChat={handleNewChat}
        userEmail={user?.email}
        onLogout={handleLogout}
      />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          activeTab={activeTab}
          activeView={activeView}
          onViewChange={setActiveView}
          chatInstanceId={selectedChat?.id}
          userId={user?.id}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
        />
        <main className="flex-1 overflow-hidden">
          {renderContent?.(context)}
        </main>
      </div>
    </div>
  );
}
