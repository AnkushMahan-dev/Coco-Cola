import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Bookmark,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Flame,
  History,
  Medal,
  RotateCcw,
  Target,
  Trophy,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { curriculum, totalLessonCount, findLesson, allLessons } from "@/content/curriculum";
import { useProgress, progressStore, computeStreak } from "@/lib/progress";
import { downloadTextFile, formatDuration } from "@/lib/utils";

const levelVariant = {
  Beginner: "success",
  Intermediate: "info",
  Advanced: "warning",
} as const;

export function DashboardPage() {
  const progress = useProgress();
  const importRef = useRef<HTMLInputElement>(null);

  const completedCount = Object.keys(progress.completed).length;
  const pct = Math.round((completedCount / totalLessonCount) * 100);

  const quizzes = Object.values(progress.quizScores);
  const avgQuiz =
    quizzes.length > 0
      ? Math.round(quizzes.reduce((a, b) => a + b, 0) / quizzes.length)
      : null;

  const secondsLogged = Object.values(progress.secondsSpent).reduce(
    (s, n) => s + n,
    0,
  );
  const timeLabel =
    secondsLogged < 60
      ? secondsLogged > 0
        ? "<1 min"
        : "0 min"
      : formatDuration(Math.round(secondsLogged / 60));

  const streak = computeStreak(progress.activeDays);

  const nextUp = allLessons.find((r) => !progress.completed[r.lesson.slug]);
  const lastVisited = progress.lastVisitedSlug
    ? findLesson(progress.lastVisitedSlug)
    : undefined;
  const resumeRef =
    lastVisited && !progress.completed[lastVisited.lesson.slug]
      ? lastVisited
      : nextUp;

  const earnedModules = curriculum.filter((m) =>
    m.lessons.every((l) => progress.completed[l.slug]),
  );
  const courseComplete = completedCount === totalLessonCount;

  const bookmarked = allLessons.filter((r) => progress.bookmarks[r.lesson.slug]);
  const recent = progress.recent
    .map((slug) => findLesson(slug))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const stats = [
    { icon: BookOpenCheck, label: "Lessons completed", value: `${completedCount} / ${totalLessonCount}` },
    { icon: Clock, label: "Time logged", value: timeLabel },
    { icon: Award, label: "Avg quiz score", value: avgQuiz === null ? "—" : `${avgQuiz}%` },
    { icon: Flame, label: "Day streak", value: `${streak}` },
  ];

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const ok = progressStore.importJSON(text);
      window.alert(
        ok
          ? "Progress imported successfully."
          : "Couldn't read that file — make sure it's a progress export (.json).",
      );
    });
    e.target.value = "";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-10">
      <Breadcrumbs items={[{ label: "Learning Dashboard" }]} />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Your progress lives in this browser. Export it to move between
            machines or back it up.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImport}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadTextFile(
                "academy-progress.json",
                progressStore.exportJSON(),
                "application/json",
              )
            }
          >
            <Download /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
            <Upload /> Import
          </Button>
          {completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                if (
                  window.confirm(
                    "Reset all progress, notes and quiz scores? This cannot be undone.",
                  )
                ) {
                  progressStore.reset();
                }
              }}
            >
              <RotateCcw /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Overall progress */}
      <div className="mt-6 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Overall progress</span>
          <span className="font-medium tabular-nums">
            {completedCount}/{totalLessonCount} · {pct}%
          </span>
        </div>
        <Progress value={pct} aria-label="Overall course progress" />
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold tabular-nums">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Continue */}
      {resumeRef && !courseComplete && (
        <Card className="mt-6 border-primary/30 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium">Pick up where you left off</p>
                <p className="text-sm text-muted-foreground">
                  {resumeRef.lesson.title}
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link to={`/lessons/${resumeRef.lesson.slug}`}>
                Continue <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Trophy className="h-4.5 w-4.5 h-[18px] w-[18px] text-primary" aria-hidden />
          Badges
        </h2>
        {earnedModules.length === 0 && !courseComplete ? (
          <p className="text-sm text-muted-foreground">
            Complete every lesson in a module to earn your first badge.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {courseComplete && (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                <Trophy className="h-4 w-4" aria-hidden /> Full course complete
              </span>
            )}
            {earnedModules.map((m) => (
              <span
                key={m.slug}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium"
              >
                <Medal className="h-4 w-4 text-primary" aria-hidden />
                {m.shortTitle}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarks + Recently viewed */}
      {(bookmarked.length > 0 || recent.length > 0) && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {bookmarked.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Bookmark className="h-[18px] w-[18px] text-primary" aria-hidden />
                Saved lessons
              </h2>
              <ul className="space-y-1">
                {bookmarked.map((r) => (
                  <li key={r.lesson.slug}>
                    <Link
                      to={`/lessons/${r.lesson.slug}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="min-w-0 flex-1 truncate">{r.lesson.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {r.module.shortTitle}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {recent.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
                <History className="h-[18px] w-[18px] text-primary" aria-hidden />
                Recently viewed
              </h2>
              <ul className="space-y-1">
                {recent.map((r) => (
                  <li key={r.lesson.slug}>
                    <Link
                      to={`/lessons/${r.lesson.slug}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="min-w-0 flex-1 truncate">{r.lesson.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {r.module.shortTitle}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* Per-module progress */}
      <div className="mt-10 space-y-6">
        {curriculum.map((module, mi) => {
          const done = module.lessons.filter((l) => progress.completed[l.slug]).length;
          const modulePct = Math.round((done / module.lessons.length) * 100);
          return (
            <Card key={module.slug}>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    <Link to={`/modules/${module.slug}`} className="hover:text-primary">
                      Module {mi + 1}: {module.title}
                    </Link>
                  </CardTitle>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {done}/{module.lessons.length} · {modulePct}%
                  </span>
                </div>
                <Progress value={modulePct} aria-label={`${module.title} progress`} />
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
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label="Completed" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 opacity-35" aria-hidden />
                          )}
                          <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                          {progress.bookmarks[lesson.slug] && (
                            <Bookmark className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Saved" />
                          )}
                          {score !== undefined && (
                            <Badge variant={score >= 70 ? "success" : "warning"} className="shrink-0">
                              {score}%
                            </Badge>
                          )}
                          <Badge variant={levelVariant[lesson.level]} className="hidden shrink-0 md:inline-flex">
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
