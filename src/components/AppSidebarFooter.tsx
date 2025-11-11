import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings as SettingsIcon, LogOut, Sparkles } from "lucide-react";
import { UserPlan } from "@/hooks/useUserPlan";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface AppSidebarFooterProps {
  userEmail: string | undefined;
  userPlan: UserPlan | null;
  onUpgrade: () => void;
  onLogout: () => void;
}

export function AppSidebarFooter({
  userEmail,
  userPlan,
  onUpgrade,
  onLogout,
}: AppSidebarFooterProps) {
  const { open: sidebarOpen } = useSidebar();
  
  const initials = userEmail ? userEmail[0].toUpperCase() : "U";
  
  const planText = userPlan?.plan_type === "free"
    ? "Free Plan"
    : userPlan?.plan_type === "pro"
    ? "Pro"
    : "Enterprise";
  
  if (!sidebarOpen) {
    return (
      <div className="border-t border-border p-2 space-y-2">
        {userPlan?.plan_type === "free" && (
          <Button
            onClick={onUpgrade}
            size="icon"
            className="w-full bg-gradient-primary hover:opacity-90"
            title="Upgrade to Pro"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all mx-auto">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent side="right" align="end" className="w-56 bg-background">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium truncate">{userEmail}</p>
                {userPlan && (
                  <Badge
                    variant={userPlan.plan_type === "free" ? "secondary" : "default"}
                    className={cn(
                      "text-xs w-fit",
                      userPlan.plan_type !== "free" &&
                        "bg-primary/20 text-primary border-primary/30"
                    )}
                  >
                    {planText}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer flex items-center">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  
  return (
    <div className="border-t border-border">
      <div className="p-4 space-y-3">
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
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
          </DropdownMenuTrigger>
          
          <DropdownMenuContent side="right" align="end" className="w-56 bg-background">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium truncate">{userEmail}</p>
                {userPlan && (
                  <Badge
                    variant={userPlan.plan_type === "free" ? "secondary" : "default"}
                    className={cn(
                      "text-xs w-fit",
                      userPlan.plan_type !== "free" &&
                        "bg-primary/20 text-primary border-primary/30"
                    )}
                  >
                    {planText}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer flex items-center">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
