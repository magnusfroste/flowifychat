import flowifyLogo from "@/assets/logo-concept-1-flowing-bubble.png";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function DashboardSidebarHeader() {
  const { open: sidebarOpen } = useSidebar();
  
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      {sidebarOpen && (
        <div className="flex items-center gap-2">
          <img src={flowifyLogo} alt="Flowify" className="h-7 w-7" />
          <span className="text-lg font-bold">Flowify</span>
        </div>
      )}
      <SidebarTrigger className={!sidebarOpen ? "mx-auto" : ""} />
    </div>
  );
}
