/**
 * View Component: Chat Header
 * Displays breadcrumbs, title, and theme toggle
 */

import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface ChatHeaderProps {
  isOwner: boolean;
  chatTitle: string;
  displayTitle?: string;
  headerStyle: 'minimal' | 'standard' | 'prominent';
  showTitle?: boolean;
  transparent?: boolean;
  user?: any;
  useLandingPageMode?: boolean;
}

export function ChatHeader({ 
  isOwner, 
  chatTitle,
  displayTitle,
  headerStyle,
  showTitle = true,
  transparent = false,
  user,
  useLandingPageMode = true
}: ChatHeaderProps) {
  const navigate = useNavigate();
  
  const getHeaderClass = () => {
    if (headerStyle === 'minimal') return 'py-2';
    if (headerStyle === 'prominent') return 'py-6 shadow-md';
    return 'py-4';
  };

  return (
    <header 
      className={`sticky top-0 z-10 ${getHeaderClass()} ${
        transparent 
          ? '' 
          : 'border-b backdrop-blur-sm bg-background/70 text-foreground'
      }`}
    >
      <div className="px-6 py-3">
        {/* Show breadcrumb for owners or authenticated non-owners */}
        {(isOwner || (user && !isOwner)) && (
          <div className="flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => navigate(isOwner ? "/dashboard" : "/dashboard")}
                    className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                  >
                    <Home className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {isOwner ? "Dashboard" : "My Chats"}
                    </span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium max-w-[200px] sm:max-w-none truncate">
                    {chatTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}
        
        {/* Show centered title for non-owners when landing is off */}
        {((user && !isOwner && !useLandingPageMode) || (!user && !isOwner)) && showTitle && (
          <div className="flex justify-center">
            <h1 className={`font-semibold ${
              headerStyle === 'prominent' ? 'text-2xl' : 
              headerStyle === 'minimal' ? 'text-base' : 
              'text-xl'
            }`}>
              {displayTitle || chatTitle}
            </h1>
          </div>
        )}
      </div>
    </header>
  );
}
