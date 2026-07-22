import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "./Header";
import { SidebarNav } from "./Sidebar";
import { CommandPalette } from "@/components/search/CommandPalette";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

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
      />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 border-r lg:block">
          <SidebarNav />
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
