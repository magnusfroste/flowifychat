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
  headerStyle: 'minimal' | 'standard' | 'prominent';
  showTitle?: boolean;
  transparent?: boolean;
  user?: any;
}

export function ChatHeader({ 
  isOwner, 
  chatTitle, 
  headerStyle,
  showTitle = true,
  transparent = false,
  user
}: ChatHeaderProps) {
  const navigate = useNavigate();
  
  const getHeaderClass = () => {
    if (headerStyle === 'minimal') return 'py-2';
    if (headerStyle === 'prominent') return 'py-6 shadow-md';
    return 'py-4';
  };

  return (
    <header 
      className={`sticky top-0 z-10 ${getHeaderClass()} ${transparent ? '' : 'border-b backdrop-blur-sm'}`}
      style={{
        backgroundColor: transparent ? 'transparent' : 'rgba(255,255,255,0.7)',
        borderColor: transparent ? 'transparent' : 'rgba(0,0,0,0.1)',
        color: '#000000',
      }}
    >
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {(isOwner || (user && !isOwner)) && (
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
            )}
            
            {!user && !isOwner && showTitle && (
              <h1 className={`font-semibold ${
                headerStyle === 'prominent' ? 'text-2xl' : 
                headerStyle === 'minimal' ? 'text-base' : 
                'text-xl'
              }`}>
                {chatTitle}
              </h1>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
