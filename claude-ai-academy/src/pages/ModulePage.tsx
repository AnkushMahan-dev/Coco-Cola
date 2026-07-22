import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { curriculum, findModule } from "@/content/curriculum";
import { useProgress } from "@/lib/progress";
import { accentStyle } from "@/lib/moduleTheme";
import { formatDuration } from "@/lib/utils";

const levelVariant = {
  Beginner: "success",
  Intermediate: "info",
  Advanced: "warning",
} as const;

export function ModulePage() {
  const { slug = "" } = useParams();
  const module = findModule(slug);
  const progress = useProgress();

  if (!module) return <Navigate to="/404" replace />;

  const moduleNumber = curriculum.indexOf(module) + 1;
  const done = module.lessons.filter((l) => progress.completed[l.slug]).length;
  const pct = Math.round((done / module.lessons.length) * 100);
  const totalMinutes = module.lessons.reduce((s, l) => s + l.duration, 0);

  return (
    <div
      className="mx-auto max-w-4xl px-4 py-8 lg:px-10"
      style={accentStyle(module.slug)}
    >
      <Breadcrumbs
        items={[{ label: "Curriculum", to: "/dashboard" }, { label: module.shortTitle }]}
      />

      <header className="mt-6 space-y-4">
        <Badge variant="secondary">Module {moduleNumber}</Badge>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
          {module.title}
        </h1>
        <p className="text-lg text-muted-foreground">{module.description}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden />
            {formatDuration(totalMinutes)} total
          </span>
          <span>{module.lessons.length} lessons</span>
          <span className="tabular-nums">
            {done}/{module.lessons.length} completed
          </span>
        </div>
        <Progress value={pct} className="max-w-md" aria-label="Module progress" />
      </header>

      <ol className="mt-10 space-y-4">
        {module.lessons.map((lesson, i) => {
          const complete = Boolean(progress.completed[lesson.slug]);
          return (
            <motion.li
              key={lesson.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
              <Link to={`/lessons/${lesson.slug}`} className="group block">
                <Card className="transition-all group-hover:border-primary/40 group-hover:shadow-md">
                  <CardContent className="flex items-center gap-4 py-5">
                    {complete ? (
                      <CheckCircle2
                        className="h-6 w-6 shrink-0 text-success"
                        aria-label="Completed"
                      />
                    ) : (
                      <Circle className="h-6 w-6 shrink-0 opacity-30" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug group-hover:text-primary">
                        {i + 1}. {lesson.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {lesson.description}
                      </p>
                    </div>
                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                      <Badge variant={levelVariant[lesson.level]}>
                        {lesson.level}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" aria-hidden />
                        {formatDuration(lesson.duration)}
                      </Badge>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </CardContent>
                </Card>
              </Link>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
