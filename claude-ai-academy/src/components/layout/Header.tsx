import { Link } from "react-router-dom";
import { GraduationCap, Menu, Moon, Search, Sun, Monitor, Download, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme";

interface HeaderProps {
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
}

export function Header({ onOpenSearch, onToggleSidebar }: HeaderProps) {
  const { setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-14 items-center gap-2 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden sm:inline">Claude AI Academy</span>
          <span className="hidden rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground md:inline">
            for SAP Developers
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:w-64 sm:justify-start sm:gap-2 sm:px-3"
            aria-label="Search lessons"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden text-sm sm:inline">Search lessons…</span>
            <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
              Ctrl K
            </kbd>
          </button>

          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link to="/dashboard" aria-label="Learning dashboard">
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link to="/downloads" aria-label="Downloads">
              <Download className="h-5 w-5" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Change theme">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
