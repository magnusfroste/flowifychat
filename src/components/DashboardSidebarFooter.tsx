import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, LogOut, Sparkles } from "lucide-react";
import { UserPlan } from "@/hooks/useUserPlan";
import { cn } from "@/lib/utils";

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
  return (
    <div className="border-t border-border">
      <div className="p-4 space-y-3">
        {/* Upgrade CTA for Free plan */}
        {userPlan?.plan_type === "free" && (
          <>
            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-primary hover:opacity-90"
              size="sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
            <Separator />
          </>
        )}

        {/* Settings Link */}
        <Link to="/settings" className="block">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>

        {/* User info */}
        <div className="px-2 py-1">
          <p className="text-sm font-medium truncate">{userEmail}</p>
          {userPlan && (
            <Badge
              variant={userPlan.plan_type === "free" ? "secondary" : "default"}
              className={cn(
                "mt-1",
                userPlan.plan_type !== "free" &&
                  "bg-primary/20 text-primary border-primary/30"
              )}
            >
              {userPlan.plan_type === "free"
                ? "Free Plan"
                : userPlan.plan_type === "pro"
                ? "Pro"
                : "Enterprise"}
            </Badge>
          )}
        </div>

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
