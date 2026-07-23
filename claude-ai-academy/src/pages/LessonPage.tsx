import { useEffect, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Clock,
  Download,
  FlaskConical,
  Image as ImageIcon,
  Lightbulb,
  Link2,
  ListChecks,
  Printer,
  ShieldCheck,
  Target,
  Video,
  XCircle,
  Database,
  FileText,
  BookMarked,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Callout } from "@/components/lesson/Callout";
import { CodeBlock } from "@/components/lesson/CodeBlock";
import { Quiz } from "@/components/lesson/Quiz";
import { ScreenshotFrame, VideoFrame } from "@/components/lesson/MediaPlaceholders";
import { findLesson, nextLesson, previousLesson } from "@/content/curriculum";
import { getLessonReferences } from "@/content/references";
import { QuickStart } from "@/components/lesson/QuickStart";
import { useLessonProgress, progressStore } from "@/lib/progress";
import { accentStyle } from "@/lib/moduleTheme";
import { downloadTextFile, formatDuration } from "@/lib/utils";

const levelVariant = {
  Beginner: "success",
  Intermediate: "info",
  Advanced: "warning",
} as const;

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: typeof Target;
  title: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      aria-labelledby={`${id}-heading`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
      className="scroll-mt-20 space-y-4"
    >
      <h2
        id={`${id}-heading`}
        className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg accent-chip">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

export function LessonPage() {
  const { slug = "" } = useParams();
  const ref = findLesson(slug);
  const { isComplete, toggle } = useLessonProgress(slug);

  useEffect(() => {
    if (ref) progressStore.setLastVisited(ref.lesson.slug);
  }, [ref]);

  if (!ref) return <Navigate to="/404" replace />;

  const { lesson, module } = ref;
  const next = nextLesson(slug);
  const prev = previousLesson(slug);
  const references = getLessonReferences(slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-10" style={accentStyle(module.slug)}>
      <Breadcrumbs
        items={[
          { label: "Curriculum", to: "/dashboard" },
          { label: module.shortTitle, to: `/modules/${module.slug}` },
          { label: lesson.title },
        ]}
      />

      {/* Lesson header */}
      <header className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={levelVariant[lesson.level]}>{lesson.level}</Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            {formatDuration(lesson.duration)}
          </Badge>
          <Badge variant="outline">{module.title}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
          {lesson.title}
        </h1>
        <p className="text-lg text-muted-foreground">{lesson.description}</p>
        <div className="no-print flex flex-wrap gap-2">
          <Button
            variant={isComplete ? "secondary" : "default"}
            size="sm"
            onClick={toggle}
          >
            {isComplete ? (
              <>
                <CheckCircle2 className="text-success animate-pop-in" /> Completed
              </>
            ) : (
              <>
                <Circle /> Mark as complete
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer /> Print / Save as PDF
          </Button>
          {lesson.download && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadTextFile(lesson.download!.filename, lesson.download!.content)
              }
            >
              <Download /> {lesson.download.name}
            </Button>
          )}
        </div>
      </header>

      <Separator className="my-8" />

      <div className="space-y-12">
        {/* Do this now — the practical quick start */}
        <QuickStart steps={lesson.steps} />

        {/* Why this matters — background theory, collapsed by default */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-center gap-2.5 rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium shadow-sm transition-colors hover:bg-muted"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg accent-chip">
                <BookOpen className="h-4 w-4" aria-hidden />
              </span>
              Why this matters &amp; what you'll learn
              <ChevronDown
                className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="mt-1 space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {lesson.overview.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4 accent-text" aria-hidden /> By the end
                  you'll be able to:
                </p>
                <ul className="grid gap-2">
                  {lesson.objectives.map((o, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Step-by-step instructions — the main event */}
        <Section id="steps" icon={ListChecks} title="Step-by-Step Instructions">
          <ol className="space-y-6">
            {lesson.steps.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.25) }}
                className="relative rounded-lg border bg-card p-5 pl-14 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  aria-hidden
                  className="absolute left-4 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                >
                  {i + 1}
                </span>
                <h3 className="font-semibold leading-snug">{step.title}</h3>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
                {step.code && <CodeBlock snippet={step.code} className="mt-4" />}
                {step.callout && (
                  <Callout
                    type={step.callout.type}
                    title={step.callout.title}
                    className="mt-4"
                  >
                    {step.callout.body}
                  </Callout>
                )}
                {(() => {
                  // Explicit per-step reference wins; otherwise fall back to
                  // this lesson's verified official references, cycling so
                  // steps surface different official docs. Guarantees every
                  // step links to an authoritative source.
                  const fallback = references.length
                    ? references[i % references.length]
                    : undefined;
                  const sref =
                    step.reference ??
                    (fallback
                      ? { label: fallback.label, url: fallback.url, kind: "doc" as const }
                      : undefined);
                  if (!sref) return null;
                  const isVideo = sref.kind === "video";
                  return (
                    <a
                      href={sref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      {isVideo ? (
                        <Video className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <BookMarked className="h-3.5 w-3.5" aria-hidden />
                      )}
                      {isVideo ? "Watch: " : "Reference: "}
                      {sref.label}
                      <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                    </a>
                  );
                })()}
              </motion.li>
            ))}
          </ol>
        </Section>

        {/* Real SAP example */}
        <Section id="sap-example" icon={Database} title="Real SAP Example">
          <Card className="border-primary/25">
            <CardHeader>
              <CardTitle className="text-base">{lesson.sapExample.title}</CardTitle>
              <CardDescription className="leading-relaxed">
                {lesson.sapExample.scenario}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lesson.sapExample.prompt && (
                <CodeBlock
                  snippet={{
                    language: "prompt",
                    filename: "prompt-to-claude.txt",
                    code: lesson.sapExample.prompt,
                  }}
                />
              )}
              {lesson.sapExample.code && <CodeBlock snippet={lesson.sapExample.code} />}
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {lesson.sapExample.explanation.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Best practices */}
        <Section id="best-practices" icon={ShieldCheck} title="Best Practices">
          <ul className="grid gap-3">
            {lesson.bestPractices.map((bp, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-success/25 bg-success/5 p-3.5 text-sm leading-relaxed"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                {bp}
              </li>
            ))}
          </ul>
        </Section>

        {/* Common mistakes */}
        <Section id="common-mistakes" icon={XCircle} title="Common Mistakes">
          <Accordion type="single" collapsible className="rounded-lg border px-4">
            {lesson.commonMistakes.map((cm, i) => (
              <AccordionItem
                key={i}
                value={`mistake-${i}`}
                className={i === lesson.commonMistakes.length - 1 ? "border-b-0" : ""}
              >
                <AccordionTrigger className="gap-3 text-left">
                  <span className="flex items-start gap-2.5">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    {cm.mistake}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="ml-6 flex items-start gap-2.5 rounded-md bg-success/5 p-3 text-sm leading-relaxed">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    <span>
                      <span className="font-semibold">Fix: </span>
                      {cm.fix}
                    </span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        {/* Tips */}
        <Section id="tips" icon={Lightbulb} title="Pro Tips">
          <div className="grid gap-3 sm:grid-cols-2">
            {lesson.tips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border bg-card p-3.5 text-sm leading-relaxed shadow-sm"
              >
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                {tip}
              </div>
            ))}
          </div>
        </Section>

        {/* Screenshots — only rendered when real images are supplied */}
        {lesson.screenshots.some((s) => s.imageUrl) && (
          <Section id="screenshots" icon={ImageIcon} title="Screenshots">
            <div className="grid gap-6 md:grid-cols-2">
              {lesson.screenshots
                .filter((s) => s.imageUrl)
                .map((s, i) => (
                  <ScreenshotFrame key={i} media={s} />
                ))}
            </div>
          </Section>
        )}

        {/* Video */}
        <Section id="video" icon={Video} title="Video Walkthrough">
          <VideoFrame video={lesson.video} lessonSlug={lesson.slug} />
        </Section>

        {/* Practice exercise */}
        <Section id="exercise" icon={FlaskConical} title="Practice Exercise">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{lesson.exercise.title}</CardTitle>
              <CardDescription className="leading-relaxed">
                {lesson.exercise.scenario}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                {lesson.exercise.tasks.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
              {lesson.exercise.hint && (
                <Callout type="tip" title="Hint">
                  {lesson.exercise.hint}
                </Callout>
              )}
              {lesson.exercise.solution && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="group">
                      <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
                      Show solution
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <CodeBlock snippet={lesson.exercise.solution} className="mt-3" />
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        </Section>

        {/* Quiz */}
        <Section id="quiz" icon={ClipboardList} title="Knowledge Check">
          <Quiz lessonSlug={lesson.slug} questions={lesson.quiz} />
        </Section>

        {/* Summary */}
        <Section id="summary" icon={FileText} title="Summary">
          <Card className="bg-accent/50">
            <CardContent className="pt-6">
              <ul className="grid gap-2.5">
                {lesson.summary.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Section>

        {/* Official documentation & references */}
        {references.length > 0 && (
          <Section id="references" icon={BookMarked} title="Official Documentation & References">
            <p className="text-sm text-muted-foreground">
              Learn more straight from the source. These are the official docs
              behind this lesson — bookmark them as your authoritative reference.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {references.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <ExternalLink
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium leading-snug group-hover:text-primary">
                        {r.label}
                      </span>
                      <Badge variant="secondary" className="shrink-0 font-normal">
                        {r.source}
                      </Badge>
                    </span>
                    {r.note && (
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {r.note}
                      </span>
                    )}
                    <span className="mt-1 block truncate text-xs text-muted-foreground/70">
                      {r.url.replace(/^https?:\/\//, "")}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Related topics */}
        {lesson.relatedSlugs.length > 0 && (
          <Section id="related" icon={Link2} title="Related Topics">
            <div className="grid gap-3 sm:grid-cols-2">
              {lesson.relatedSlugs.map((rs) => {
                const rel = findLesson(rs);
                if (!rel) return null;
                return (
                  <Link
                    key={rs}
                    to={`/lessons/${rs}`}
                    className="group rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {rel.module.shortTitle}
                    </p>
                    <p className="mt-1 font-medium leading-snug group-hover:text-primary">
                      {rel.lesson.title}
                    </p>
                  </Link>
                );
              })}
            </div>
          </Section>
        )}
      </div>

      {/* Prev / Next lesson */}
      <Separator className="my-10" />
      <div className="no-print grid gap-4 sm:grid-cols-2">
        {prev ? (
          <Link
            to={`/lessons/${prev.lesson.slug}`}
            className="group flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Previous lesson</p>
              <p className="truncate text-sm font-medium">{prev.lesson.title}</p>
            </div>
          </Link>
        ) : (
          <div aria-hidden />
        )}
        {next && (
          <Link
            to={`/lessons/${next.lesson.slug}`}
            className="group flex items-center justify-end gap-3 rounded-lg border border-primary/30 bg-card p-4 text-right shadow-sm transition-all hover:border-primary hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Next lesson</p>
              <p className="truncate text-sm font-medium">{next.lesson.title}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
