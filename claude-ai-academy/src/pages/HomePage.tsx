import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Briefcase,
  Clock,
  Database,
  Download,
  Gauge,
  GraduationCap,
  MessageSquare,
  Monitor,
  Plug,
  Rocket,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { curriculum, totalLessonCount, findLesson } from "@/content/curriculum";
import { useProgress } from "@/lib/progress";
import { accentStyle } from "@/lib/moduleTheme";
import { formatDuration } from "@/lib/utils";
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

const highlights = [
  {
    icon: Bot,
    title: "Built for ABAP developers",
    text: "Every lesson uses real SAP scenarios — ATC findings, CDS views, RAP, S/4HANA custom code migration — not generic AI demos.",
  },
  {
    icon: Monitor,
    title: "Windows-first guidance",
    text: "Installation paths, PowerShell commands, %APPDATA% configs and shortcuts written for your Windows laptop.",
  },
  {
    icon: Search,
    title: "Training + reference in one",
    text: "Follow the structured path from beginner to advanced, or jump straight to any topic with global search (Ctrl+K).",
  },
  {
    icon: Download,
    title: "Take-away assets",
    text: "Downloadable SAP prompt packs, checklists and printable PDF guides in every lesson.",
  },
];

export function HomePage() {
  const progress = useProgress();
  const completedCount = Object.keys(progress.completed).length;
  const pct = Math.round((completedCount / totalLessonCount) * 100);
  const lastVisited = progress.lastVisitedSlug
    ? findLesson(progress.lastVisitedSlug)
    : undefined;
  const resumeTarget = lastVisited ?? {
    lesson: curriculum[0].lessons[0],
    module: curriculum[0],
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div aria-hidden className="pointer-events-none absolute inset-0 hero-mesh" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 lg:px-10 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl space-y-6"
          >
            <Badge variant="secondary" className="gap-1.5 py-1">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden />
              {curriculum.length} modules · {totalLessonCount} hands-on lessons
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              Master Claude AI for{" "}
              <span className="text-gradient">SAP development</span>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              A structured training platform and reference guide that takes SAP
              ABAP developers, technical leads and architects from first prompt
              to AI-assisted S/4HANA delivery — with real project examples,
              best practices and security guardrails.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to={`/lessons/${resumeTarget.lesson.slug}`}>
                  {completedCount > 0 ? "Continue learning" : "Start learning"}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/dashboard">
                  <BookOpen aria-hidden /> View curriculum
                </Link>
              </Button>
            </div>
            {completedCount > 0 && (
              <div className="max-w-md space-y-1.5 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your progress</span>
                  <span className="font-medium">
                    {completedCount}/{totalLessonCount} lessons · {pct}%
                  </span>
                </div>
                <Progress value={pct} aria-label="Overall course progress" />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-5xl px-4 py-14 lg:px-10">
        <div className="grid gap-5 sm:grid-cols-2">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <Card className="h-full">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <h.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="space-y-1.5">
                    <CardTitle className="text-base">{h.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {h.text}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Curriculum overview */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-14 lg:px-10">
          <div className="mb-8 space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              The learning path
            </h2>
            <p className="text-muted-foreground">
              Eight modules, from your first chat to full AI-assisted SAP
              project delivery.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {curriculum.map((module, i) => {
              const Icon = moduleIcons[module.icon];
              const total = module.lessons.reduce((s, l) => s + l.duration, 0);
              const done = module.lessons.filter(
                (l) => progress.completed[l.slug],
              ).length;
              return (
                <motion.div
                  key={module.slug}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: (i % 2) * 0.06 }}
                >
                  <Link
                    to={`/modules/${module.slug}`}
                    className="group block h-full"
                    style={accentStyle(module.slug)}
                  >
                    <Card className="relative h-full overflow-hidden transition-all accent-border group-hover:-translate-y-0.5 group-hover:shadow-lg">
                      <span aria-hidden className="absolute inset-x-0 top-0 h-1 accent-bar" />
                      <CardHeader className="flex-row items-start gap-4 space-y-0 pt-6">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg accent-chip">
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base transition-colors group-hover:accent-text">
                              {i + 1}. {module.title}
                            </CardTitle>
                            <ArrowRight
                              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                              aria-hidden
                            />
                          </div>
                          <CardDescription className="leading-relaxed">
                            {module.description}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" aria-hidden />
                          {module.lessons.length} lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          {formatDuration(total)}
                        </span>
                        {done > 0 && (
                          <Badge variant="success" className="ml-auto">
                            {done}/{module.lessons.length} done
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground lg:px-10">
          <p>
            Claude AI Academy for SAP Developers — an internal enablement
            portal. Claude is a product of Anthropic; SAP, ABAP and S/4HANA are
            trademarks of SAP SE.
          </p>
        </div>
      </footer>
    </div>
  );
}
