import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, useSidebar } from "@/components/ui/sidebar";
import { DashboardSidebarHeader } from "./DashboardSidebarHeader";
import { DashboardSidebarChatList } from "./DashboardSidebarChatList";
import { DashboardSidebarFooter } from "./DashboardSidebarFooter";
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

interface DashboardSidebarProps {
  chatInstances: ChatInstance[];
  selectedChatId: string | null;
  onSelectChat: (id: string | null) => void;
  onCreateNew: () => void;
  userEmail: string | undefined;
  userPlan: UserPlan | null;
  onUpgrade: () => void;
  onLogout: () => void;
  canCreateMore: boolean;
  currentChatId?: string;
}

export function DashboardSidebar({
  chatInstances,
  selectedChatId,
  onSelectChat,
  onCreateNew,
  userEmail,
  userPlan,
  onUpgrade,
  onLogout,
  canCreateMore,
  currentChatId,
}: DashboardSidebarProps) {
  const { open: sidebarOpen } = useSidebar();
  
  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <DashboardSidebarHeader />

      <SidebarContent className="flex flex-col">
        {/* Primary Action */}
        <div className="px-4 py-3">
          <Button
            onClick={canCreateMore ? onCreateNew : onUpgrade}
            className="w-full justify-start"
            variant={canCreateMore ? "default" : "outline"}
            size={sidebarOpen ? "default" : "icon"}
          >
            <Plus className={sidebarOpen ? "mr-2 h-4 w-4" : "h-4 w-4"} />
            {sidebarOpen && (canCreateMore ? "New Chat" : "Upgrade to Create")}
          </Button>
        </div>

        {/* Chat List */}
        <SidebarGroup className="flex-1 px-0">
          <SidebarGroupContent className="flex flex-col h-full">
            <DashboardSidebarChatList
              chatInstances={chatInstances}
              selectedChatId={selectedChatId}
              onSelectChat={onSelectChat}
            />
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
  );
}
