import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings as SettingsIcon, LogOut, Sparkles } from "lucide-react";
import { UserPlan } from "@/hooks/useUserPlan";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface DashboardSidebarFooterProps {
  userEmail: string | undefined;
  userPlan: UserPlan | null;
  onUpgrade: () => void;
  onLogout: () => void;
}

export function DashboardSidebarFooter({
  userEmail,
  userPlan,
  onUpgrade,
  onLogout,
}: DashboardSidebarFooterProps) {
  const { open: sidebarOpen } = useSidebar();
  
  // Extract initials from email
  const initials = userEmail ? userEmail[0].toUpperCase() : "U";
  
  // Plan badge text
  const planText = userPlan?.plan_type === "free"
    ? "Free Plan"
    : userPlan?.plan_type === "pro"
    ? "Pro"
    : "Enterprise";
  
  // Collapsed state: Show only avatar circle
  if (!sidebarOpen) {
    return (
      <div className="border-t border-border p-2 flex items-center justify-center">
        <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }
  
  // Expanded state: Show full user menu
  return (
    <div className="border-t border-border">
      <div className="p-4 space-y-3">
        {/* User info with avatar */}
        <div className="flex items-center gap-3 px-1">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userEmail}</p>
            {userPlan && (
              <Badge
                variant={userPlan.plan_type === "free" ? "secondary" : "default"}
                className={cn(
                  "mt-1 text-xs",
                  userPlan.plan_type !== "free" &&
                    "bg-primary/20 text-primary border-primary/30"
                )}
              >
                {planText}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Settings Link */}
        <Link to="/settings" className="block">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>

        {/* Upgrade CTA for Free plan */}
        {userPlan?.plan_type === "free" && (
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-primary hover:opacity-90"
            size="sm"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
        )}

        <Separator />

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          size="sm"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
