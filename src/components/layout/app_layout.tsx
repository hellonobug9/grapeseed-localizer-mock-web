import { useState } from "react";
import { Outlet } from "react-router";
import { AppSidebar } from "@/components/layout/app_sidebar";
import { AppTopbar } from "@/components/layout/app_topbar";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 -translate-x-full shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none",
          sidebarOpen && "translate-x-0",
        )}
      >
        <AppSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(15,27,45,.35)] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="w-full px-4 py-5 text-sm lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
