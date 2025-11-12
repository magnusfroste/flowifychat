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
import { ThemeToggle } from "@/components/ThemeToggle";

interface ChatHeaderProps {
  isOwner: boolean;
  chatTitle: string;
  headerStyle: 'minimal' | 'standard' | 'prominent';
  isDark: boolean;
}

export function ChatHeader({ isOwner, chatTitle, headerStyle, isDark }: ChatHeaderProps) {
  const navigate = useNavigate();
  
  const getHeaderClass = () => {
    if (headerStyle === 'minimal') return 'py-2';
    if (headerStyle === 'prominent') return 'py-6 shadow-md';
    return 'py-4';
  };

  return (
    <header 
      className={`border-b backdrop-blur-sm sticky top-0 z-10 ${getHeaderClass()}`}
      style={{
        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        color: isDark ? '#ffffff' : '#000000',
      }}
    >
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isOwner && (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => navigate("/dashboard")}
                      className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                    >
                      <Home className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Dashboard</span>
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
            )}
            
            {!isOwner && headerStyle !== 'minimal' && (
              <h1 className={`font-semibold ${headerStyle === 'prominent' ? 'text-2xl' : 'text-xl'}`}>
                {chatTitle}
              </h1>
            )}
          </div>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
