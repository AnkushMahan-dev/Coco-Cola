import { NavLink, useLocation } from "react-router-dom";
import { Check, Download, Home, LayoutDashboard, PlayCircle, Rocket, MessageSquare, Sparkles, Plug, Database, Shield, Briefcase, Gauge } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { curriculum } from "@/content/curriculum";
import { useProgress } from "@/lib/progress";
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
  { to: "/reels", label: "Quick Reels", icon: PlayCircle },
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

      <div className="mt-5 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Curriculum
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-10 pt-1.5 scrollbar-thin">
        <Accordion
          type="multiple"
          defaultValue={activeModule ? [activeModule.slug] : [curriculum[0].slug]}
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
              >
                <AccordionTrigger className="rounded-md px-2 py-1.5 text-sm hover:bg-muted hover:no-underline">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate font-medium text-foreground">
                      {mi + 1}. {module.shortTitle}
                    </span>
                    <span className="ml-auto shrink-0 pr-1 text-[11px] tabular-nums text-muted-foreground">
                      {done}/{module.lessons.length}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-1 pl-[15px]">
                  <ul className="border-l border-border">
                    {module.lessons.map((lesson) => {
                      const complete = Boolean(progress.completed[lesson.slug]);
                      return (
                        <li key={lesson.slug}>
                          <NavLink
                            to={`/lessons/${lesson.slug}`}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                              cn(
                                "-ml-px flex items-center gap-2 border-l py-1.5 pl-4 text-[13px] leading-snug transition-colors",
                                isActive
                                  ? "border-primary font-medium text-primary"
                                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                              )
                            }
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {lesson.title}
                            </span>
                            {complete && (
                              <Check
                                className="h-3.5 w-3.5 shrink-0 text-success"
                                aria-label="Completed"
                              />
                            )}
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
