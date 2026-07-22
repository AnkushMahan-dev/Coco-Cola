import { NavLink, useLocation } from "react-router-dom";
import { CheckCircle2, Circle, Download, Home, LayoutDashboard, BookOpen, Rocket, MessageSquare, Sparkles, Plug, Database, Shield, Briefcase, Gauge } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { curriculum } from "@/content/curriculum";
import { useProgress } from "@/lib/progress";
import { accentStyle } from "@/lib/moduleTheme";
import { cn } from "@/lib/utils";
import type { ModuleIcon } from "@/content/types";

const moduleIcons: Record<ModuleIcon, typeof Rocket> = {
  rocket: Rocket,
  "message-square": MessageSquare,
  sparkles: Sparkles,
  plug: Plug,
  database: Database,
  shield: Shield,
  briefcase: Briefcase,
  gauge: Gauge,
};

const topLinks = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/dashboard", label: "Learning Dashboard", icon: LayoutDashboard },
  { to: "/downloads", label: "Downloads", icon: Download },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const progress = useProgress();
  const location = useLocation();

  // Open the module containing the current lesson by default.
  const activeModule = curriculum.find((m) =>
    m.lessons.some((l) => location.pathname === `/lessons/${l.slug}`),
  );

  return (
    <nav aria-label="Course navigation" className="flex h-full flex-col">
      <div className="space-y-1 px-3 pt-4">
        {topLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <link.icon className="h-4 w-4" aria-hidden />
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" aria-hidden />
        Curriculum
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-8 pt-2 scrollbar-thin">
        <Accordion
          type="multiple"
          defaultValue={activeModule ? [activeModule.slug] : [curriculum[0].slug]}
          className="space-y-1"
        >
          {curriculum.map((module, mi) => {
            const Icon = moduleIcons[module.icon];
            const done = module.lessons.filter(
              (l) => progress.completed[l.slug],
            ).length;
            return (
              <AccordionItem
                key={module.slug}
                value={module.slug}
                className="border-none"
                style={accentStyle(module.slug)}
              >
                <AccordionTrigger className="rounded-md px-3 py-2 text-sm hover:bg-muted hover:no-underline">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md accent-chip">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="truncate font-medium">
                      {mi + 1}. {module.shortTitle}
                    </span>
                    <span className="ml-auto shrink-0 pr-1 text-xs tabular-nums text-muted-foreground">
                      {done}/{module.lessons.length}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <ul className="ml-4 space-y-0.5 border-l pl-3">
                    {module.lessons.map((lesson) => {
                      const complete = Boolean(progress.completed[lesson.slug]);
                      return (
                        <li key={lesson.slug}>
                          <NavLink
                            to={`/lessons/${lesson.slug}`}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                              cn(
                                "flex items-start gap-2 rounded-md px-2 py-1.5 text-[13px] leading-snug transition-colors",
                                isActive
                                  ? "bg-accent font-medium text-accent-foreground"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )
                            }
                          >
                            {complete ? (
                              <CheckCircle2
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                                aria-label="Completed"
                              />
                            ) : (
                              <Circle
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-40"
                                aria-hidden
                              />
                            )}
                            {lesson.title}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </nav>
  );
}
