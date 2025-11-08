import { Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useNavigate } from "react-router-dom";

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

interface DashboardSidebarChatListProps {
  chatInstances: ChatInstance[];
  selectedChatId: string | null;
  onSelectChat: (id: string | null) => void;
}

export function DashboardSidebarChatList({
  chatInstances,
  selectedChatId,
  onSelectChat,
}: DashboardSidebarChatListProps) {
  if (chatInstances.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">No chat instances yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create your first one!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="px-2 py-2 space-y-1">
        {/* All Chats option */}
        <button
          onClick={() => onSelectChat(null)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left",
            selectedChatId === null
              ? "bg-primary/10 text-primary border-l-2 border-primary"
              : "hover:bg-accent/10 text-foreground"
          )}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">All Chats</p>
            <p className="text-xs text-muted-foreground">
              {chatInstances.length} instance{chatInstances.length !== 1 ? "s" : ""}
            </p>
          </div>
        </button>

        {/* Chat instances */}
        {chatInstances.map((chat) => {
          const hasActivity = chat.analytics && (chat.analytics.unique_views > 0 || chat.analytics.total_messages > 0);
          const navigate = useNavigate();
          
          return (
            <div key={chat.id} className="relative group">
              {/* Main clickable area - Opens live chat */}
              <Link
                to={`/chat/${chat.slug || chat.id}`}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left",
                  selectedChatId === chat.id
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "hover:bg-accent/10 text-foreground"
                )}
              >
                {/* Status indicator */}
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    chat.is_active ? "bg-green-500" : "bg-muted"
                  )}
                />

                {/* Chat info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{chat.name}</p>
                  {chat.analytics && (
                    <p className="text-xs text-muted-foreground">
                      {chat.analytics.total_messages} message{chat.analytics.total_messages !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Activity indicator */}
                {hasActivity && (
                  <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </Link>

              {/* Settings icon - Opens configuration */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/chat/${chat.id}/edit`);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-accent opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity"
                aria-label="Chat settings"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
