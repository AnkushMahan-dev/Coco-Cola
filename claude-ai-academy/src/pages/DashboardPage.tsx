import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  RotateCcw,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { curriculum, totalLessonCount, findLesson, allLessons } from "@/content/curriculum";
import { useProgress, progressStore } from "@/lib/progress";
import { formatDuration } from "@/lib/utils";

const levelVariant = {
  Beginner: "success",
  Intermediate: "info",
  Advanced: "warning",
} as const;

export function DashboardPage() {
  const progress = useProgress();
  const completedCount = Object.keys(progress.completed).length;
  const pct = Math.round((completedCount / totalLessonCount) * 100);

  const quizzes = Object.values(progress.quizScores);
  const avgQuiz =
    quizzes.length > 0
      ? Math.round(quizzes.reduce((a, b) => a + b, 0) / quizzes.length)
      : null;

  const minutesDone = allLessons
    .filter((r) => progress.completed[r.lesson.slug])
    .reduce((s, r) => s + r.lesson.duration, 0);

  const nextUp = allLessons.find((r) => !progress.completed[r.lesson.slug]);
  const lastVisited = progress.lastVisitedSlug
    ? findLesson(progress.lastVisitedSlug)
    : undefined;

  const stats = [
    {
      icon: BookOpenCheck,
      label: "Lessons completed",
      value: `${completedCount} / ${totalLessonCount}`,
    },
    {
      icon: Clock,
      label: "Learning time logged",
      value: formatDuration(minutesDone),
    },
    {
      icon: Award,
      label: "Average quiz score",
      value: avgQuiz === null ? "—" : `${avgQuiz}%`,
    },
    {
      icon: Flame,
      label: "Overall progress",
      value: `${pct}%`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-10">
      <Breadcrumbs items={[{ label: "Learning Dashboard" }]} />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Learning Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track your progress through the curriculum. Everything is saved
            locally in your browser.
          </p>
        </div>
        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              if (
                window.confirm(
                  "Reset all progress and quiz scores? This cannot be undone.",
                )
              ) {
                progressStore.reset();
              }
            }}
          >
            <RotateCcw /> Reset progress
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-xl font-bold tabular-nums">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Continue / next up */}
      {(lastVisited || nextUp) && (
        <Card className="mt-6 border-primary/30 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium">
                  {completedCount === totalLessonCount
                    ? "Curriculum complete — brilliant work! Revisit any lesson as a reference."
                    : "Pick up where you left off"}
                </p>
                {completedCount < totalLessonCount && (
                  <p className="text-sm text-muted-foreground">
                    {(lastVisited && !progress.completed[lastVisited.lesson.slug]
                      ? lastVisited
                      : nextUp
                    )?.lesson.title}
                  </p>
                )}
              </div>
            </div>
            {completedCount < totalLessonCount && (
              <Button asChild size="sm">
                <Link
                  to={`/lessons/${
                    (lastVisited && !progress.completed[lastVisited.lesson.slug]
                      ? lastVisited
                      : nextUp
                    )?.lesson.slug
                  }`}
                >
                  Continue <ArrowRight aria-hidden />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Per-module progress */}
      <div className="mt-10 space-y-6">
        {curriculum.map((module, mi) => {
          const done = module.lessons.filter(
            (l) => progress.completed[l.slug],
          ).length;
          const modulePct = Math.round((done / module.lessons.length) * 100);
          return (
            <Card key={module.slug}>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    <Link
                      to={`/modules/${module.slug}`}
                      className="hover:text-primary"
                    >
                      Module {mi + 1}: {module.title}
                    </Link>
                  </CardTitle>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {done}/{module.lessons.length} · {modulePct}%
                  </span>
                </div>
                <Progress
                  value={modulePct}
                  aria-label={`${module.title} progress`}
                />
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {module.lessons.map((lesson) => {
                    const complete = Boolean(progress.completed[lesson.slug]);
                    const score = progress.quizScores[lesson.slug];
                    return (
                      <li key={lesson.slug}>
                        <Link
                          to={`/lessons/${lesson.slug}`}
                          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                        >
                          {complete ? (
                            <CheckCircle2
                              className="h-4 w-4 shrink-0 text-success"
                              aria-label="Completed"
                            />
                          ) : (
                            <Circle
                              className="h-4 w-4 shrink-0 opacity-35"
                              aria-hidden
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {lesson.title}
                          </span>
                          {score !== undefined && (
                            <Badge
                              variant={score >= 70 ? "success" : "warning"}
                              className="shrink-0"
                            >
                              {score}%
                            </Badge>
                          )}
                          <Badge
                            variant={levelVariant[lesson.level]}
                            className="hidden shrink-0 md:inline-flex"
                          >
                            {lesson.level}
                          </Badge>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
