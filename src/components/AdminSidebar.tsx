import { LayoutGrid, Settings, MessageSquare, Palette, Wrench, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminActiveTab, AdminActiveView } from "@/types/adminLayout";

interface AdminSidebarProps {
  activeTab: AdminActiveTab;
  activeView: AdminActiveView;
  onViewChange: (view: AdminActiveView) => void;
}

interface SidebarLink {
  id: AdminActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const dashboardLinks: SidebarLink[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'settings', label: 'Account Settings', icon: Settings },
];

const chatLinks: SidebarLink[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'settings', label: 'Settings', icon: Wrench },
  { id: 'sessions', label: 'Sessions', icon: Users },
];

export function AdminSidebar({ activeTab, activeView, onViewChange }: AdminSidebarProps) {
  const links = activeTab === 'dashboard' ? dashboardLinks : chatLinks;

  return (
    <aside className="w-48 border-r border-border bg-sidebar shrink-0 flex flex-col">
      <nav className="flex-1 py-4 px-2 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeView === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onViewChange(link.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
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
    </aside>
  );
}
