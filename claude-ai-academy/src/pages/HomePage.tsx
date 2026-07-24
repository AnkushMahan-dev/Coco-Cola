import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Boxes,
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
import { Reels } from "@/components/Reels";
import { useProgress } from "@/lib/progress";
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
      <section className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-16 lg:px-10 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="max-w-2xl space-y-6"
          >
            <Badge variant="secondary" className="gap-1.5 py-1 font-medium">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden />
              {curriculum.length} modules · {totalLessonCount} lessons
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight lg:text-5xl">
              Master Claude AI for{" "}
              <span className="text-primary">SAP development</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              A structured, hands-on path that takes SAP ABAP developers and
              architects from their first prompt to AI-assisted S/4HANA
              delivery — with real project examples, best practices and
              security guardrails.
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
                  <span className="font-medium tabular-nums">
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

      {/* Quick reels — short vertical YouTube clips */}
      <Reels />

      {/* Section 1 — The learning path (the structured curriculum) */}
      <section className="scroll-mt-20 border-t bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-16 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-8 space-y-2"
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Curriculum
            </span>
            <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
              The learning path
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Eight modules, from your first chat to full AI-assisted SAP
              project delivery — follow them in order or jump to what you need.
            </p>
          </motion.div>
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
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: (i % 2) * 0.05 }}
                >
                  <Link
                    to={`/modules/${module.slug}`}
                    className="group block h-full"
                  >
                    <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/40">
                      <CardHeader className="flex-row items-start gap-4 space-y-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md accent-chip">
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

      {/* Section 2 — Explore the Claude ecosystem (now its own page) */}
      <section className="scroll-mt-20 border-t bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-wrap items-center justify-between gap-6 rounded-xl border bg-card p-8"
          >
            <div className="max-w-xl space-y-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                Ecosystem
              </span>
              <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
                Explore the Claude ecosystem
              </h2>
              <p className="text-muted-foreground">
                Every product &amp; feature from the{" "}
                <span className="font-medium text-foreground">claude.com</span>{" "}
                navigation — official pages, plus where each is covered in this
                Academy, all on one page.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link to="/ecosystem">
                <Boxes aria-hidden /> Browse the ecosystem
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </motion.div>
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
