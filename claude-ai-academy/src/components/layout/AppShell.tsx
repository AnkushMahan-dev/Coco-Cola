import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "./Header";
import { SidebarNav } from "./Sidebar";
import { CommandPalette } from "@/components/search/CommandPalette";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "academy-sidebar-collapsed";

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Desktop sidebar collapse (hide/unhide), remembered across visits.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });
  const location = useLocation();

  const toggleSidebar = () =>
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  // Global Ctrl+K / Cmd+K shortcut for search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scroll to top on route change.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Header
        onOpenSearch={() => setSearchOpen(true)}
        onToggleSidebar={() => setMobileNavOpen(true)}
        onToggleDesktopSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex">
        {/* Desktop sidebar — collapsible (hide/unhide) */}
        <aside
          className={cn(
            "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 overflow-hidden border-r transition-[width] duration-300 ease-in-out lg:block",
            sidebarCollapsed ? "w-0 border-r-0" : "w-72",
          )}
          aria-hidden={sidebarCollapsed}
        >
          <div className="h-full w-72">
            <SidebarNav />
          </div>
        </aside>

        {/* Mobile sidebar drawer */}
        <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <DialogContent className="fixed left-0 top-0 h-full max-w-[300px] translate-x-0 translate-y-0 gap-0 rounded-none border-r p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:rounded-none">
            <DialogTitle className="sr-only">Navigation</DialogTitle>
            <div className="h-full overflow-hidden pt-8">
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>

        <main className="min-w-0 flex-1">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
