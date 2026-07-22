import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { BookOpen, FileText, Home, LayoutDashboard, Download, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { searchLessons } from "@/lib/search";
import { curriculum } from "@/content/curriculum";
import { Badge } from "@/components/ui/badge";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = searchLessons(query, 12);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl [&>button]:hidden">
        <DialogTitle className="sr-only">Search the Academy</DialogTitle>
        <Command shouldFilter={false} label="Global search">
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search lessons, topics, keywords…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
              No results found. Try “MCP”, “CDS”, “prompt”…
            </Command.Empty>

            {query.length === 0 && (
              <Command.Group
                heading="Go to"
                className="text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {[
                  { icon: Home, label: "Home", path: "/" },
                  { icon: LayoutDashboard, label: "Learning Dashboard", path: "/dashboard" },
                  { icon: Download, label: "Downloads", path: "/downloads" },
                ].map((item) => (
                  <Command.Item
                    key={item.path}
                    value={item.label}
                    onSelect={() => go(item.path)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                ))}
                {curriculum.map((m) => (
                  <Command.Item
                    key={m.slug}
                    value={m.title}
                    onSelect={() => go(`/modules/${m.slug}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    {m.title}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.length > 0 && (
              <Command.Group
                heading="Lessons"
                className="text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {results.map(({ ref }) => (
                  <Command.Item
                    key={ref.lesson.slug}
                    value={ref.lesson.slug}
                    onSelect={() => go(`/lessons/${ref.lesson.slug}`)}
                    className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2.5 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {ref.lesson.title}
                        </span>
                        <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                          {ref.module.shortTitle}
                        </Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {ref.lesson.description}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
