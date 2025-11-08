import flowifyLogo from "@/assets/logo-concept-1-flowing-bubble.png";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardSidebarHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <img src={flowifyLogo} alt="Flowify" className="h-7 w-7" />
        <span className="text-lg font-bold">Flowify</span>
      </div>
      <SidebarTrigger className="lg:hidden" />
    </div>
  );
}
