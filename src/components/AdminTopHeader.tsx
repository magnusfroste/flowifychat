import { Plus, LogOut, ChevronDown, LayoutDashboard, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AdminChatInstance, AdminActiveTab } from "@/types/adminLayout";

interface AdminTopHeaderProps {
  chatInstances: AdminChatInstance[];
  activeTab: AdminActiveTab;
  selectedChatId: string | null;
  onTabChange: (tab: AdminActiveTab) => void;
  onNewChat: () => void;
  userEmail?: string;
  onLogout: () => void;
}

export function AdminTopHeader({
  chatInstances,
  activeTab,
  selectedChatId,
  onTabChange,
  onNewChat,
  userEmail,
  onLogout,
}: AdminTopHeaderProps) {
  // Show up to 5 tabs directly, rest in overflow
  const visibleChats = chatInstances.slice(0, 5);
  const overflowChats = chatInstances.slice(5);

  return (
    <header className="h-12 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 gap-1 shrink-0 z-20">
      {/* Dashboard tab */}
      <button
        onClick={() => onTabChange('dashboard')}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          activeTab === 'dashboard'
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </button>

      {/* Separator */}
      <div className="h-5 w-px bg-border mx-1" />

      {/* Chat instance tabs */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {visibleChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onTabChange(chat.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === chat.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {chat.name}
          </button>
        ))}

        {/* Overflow dropdown */}
        {overflowChats.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                <ChevronDown className="h-4 w-4" />
                <span className="text-xs ml-1">+{overflowChats.length}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {overflowChats.map((chat) => (
                <DropdownMenuItem key={chat.id} onClick={() => onTabChange(chat.id)}>
                  <MessageSquare className="mr-2 h-3.5 w-3.5" />
                  {chat.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* New Chat button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-muted-foreground hover:text-primary ml-1"
        onClick={onNewChat}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1.5">
            <span className="hidden sm:inline max-w-[150px] truncate">{userEmail}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
            {userEmail}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
