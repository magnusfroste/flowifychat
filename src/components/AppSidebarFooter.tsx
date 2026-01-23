import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings as SettingsIcon, LogOut } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface AppSidebarFooterProps {
  userEmail: string | undefined;
  onLogout: () => void;
}

export function AppSidebarFooter({
  userEmail,
  onLogout,
}: AppSidebarFooterProps) {
  const { open: sidebarOpen } = useSidebar();
  
  const initials = userEmail ? userEmail[0].toUpperCase() : "U";
  
  if (!sidebarOpen) {
    return (
      <div className="border-t border-border p-2 space-y-2">
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
              </div>
            </div>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent side="right" align="end" className="w-56 bg-background">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium truncate">{userEmail}</p>
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
