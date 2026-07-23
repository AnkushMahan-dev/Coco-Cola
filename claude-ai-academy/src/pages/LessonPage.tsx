import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Download,
  ExternalLink,
  Printer,
  ThumbsDown,
  ThumbsUp,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Callout } from "@/components/lesson/Callout";
import { CodeBlock } from "@/components/lesson/CodeBlock";
import { Quiz } from "@/components/lesson/Quiz";
import { QuickStart } from "@/components/lesson/QuickStart";
import { ScreenshotFrame, VideoFrame } from "@/components/lesson/MediaPlaceholders";
import { OnThisPage, type TocItem } from "@/components/lesson/OnThisPage";
import { findLesson, nextLesson, previousLesson } from "@/content/curriculum";
import { getLessonReferences } from "@/content/references";
import { useLessonProgress, useLessonTimer, progressStore } from "@/lib/progress";
import { downloadTextFile, formatDuration } from "@/lib/utils";

const levelVariant = {
  Beginner: "success",
  Intermediate: "info",
  Advanced: "warning",
} as const;

/** A docs-style section: heading + content, separated by a hairline rule. */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="scroll-mt-24 border-t border-border pt-10 first:border-0 first:pt-0"
    >
      <h2
        id={`${id}-h`}
        className="mb-4 text-lg font-semibold tracking-tight text-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function NotesField({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onSave(draft)}
      placeholder="Jot notes for this lesson — saved to this browser."
      className="min-h-[92px] w-full rounded-md border border-input bg-card p-3 text-sm leading-6 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    />
  );
}

export function LessonPage() {
  const { slug = "" } = useParams();
  const ref = findLesson(slug);
  const {
    isComplete,
    toggle,
    isBookmarked,
    toggleBookmark,
    helpful,
    setHelpful,
    note,
    setNote,
  } = useLessonProgress(slug);
  useLessonTimer(slug);

  useEffect(() => {
    if (ref) progressStore.setLastVisited(ref.lesson.slug);
  }, [ref]);

  if (!ref) return <Navigate to="/404" replace />;

  const { lesson, module } = ref;
  const next = nextLesson(slug);
  const prev = previousLesson(slug);
  const references = getLessonReferences(slug);
  const hasScreens = lesson.screenshots.some((s) => s.imageUrl);

  const toc: TocItem[] = [
    { id: "quickstart", label: "Quick start" },
    { id: "overview", label: "Overview" },
    { id: "steps", label: "Steps" },
    { id: "sap-example", label: "SAP example" },
    { id: "best-practices", label: "Best practices" },
    { id: "common-mistakes", label: "Common mistakes" },
    { id: "tips", label: "Tips" },
    ...(hasScreens ? [{ id: "screenshots", label: "Screenshots" }] : []),
    { id: "video", label: "Video" },
    { id: "exercise", label: "Exercise" },
    { id: "quiz", label: "Quiz" },
    { id: "summary", label: "Summary" },
    ...(references.length ? [{ id: "references", label: "References" }] : []),
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1180px] gap-12 px-5 py-8 lg:px-8">
      {/* Reading column */}
      <article className="min-w-0 max-w-[720px] flex-1">
        <Breadcrumbs
          items={[
            { label: module.shortTitle, to: `/modules/${module.slug}` },
            { label: lesson.title },
          ]}
        />

        <header className="mt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{module.title}</span>
            <span aria-hidden>·</span>
            <Badge variant={levelVariant[lesson.level]}>{lesson.level}</Badge>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatDuration(lesson.duration)}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {lesson.title}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            {lesson.description}
          </p>

          <div className="no-print mt-5 flex flex-wrap items-center gap-2">
            <Button
              variant={isComplete ? "secondary" : "default"}
              size="sm"
              onClick={toggle}
            >
              {isComplete ? (
                <>
                  <CheckCircle2 className="text-success" /> Completed
                </>
              ) : (
                <>
                  <Circle /> Mark complete
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleBookmark}>
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="text-primary" /> Saved
                </>
              ) : (
                <>
                  <Bookmark /> Save
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer /> Print
            </Button>
            {lesson.download && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  downloadTextFile(
                    lesson.download!.filename,
                    lesson.download!.content,
                  )
                }
              >
                <Download /> {lesson.download.name}
              </Button>
            )}
          </div>
        </header>

        <div className="mt-10 space-y-10">
          {/* Quick start */}
          <section id="quickstart" className="scroll-mt-24">
            <QuickStart steps={lesson.steps} />
          </section>

          {/* Overview + objectives */}
          <Section id="overview" title="Overview">
            <div className="space-y-3 text-[15px] leading-7 text-muted-foreground">
              {lesson.overview.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">
                What you'll be able to do
              </p>
              <ul className="grid gap-1.5">
                {lesson.objectives.map((o, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* Steps */}
          <Section id="steps" title="Step-by-step">
            <ol className="space-y-8">
              {lesson.steps.map((step, i) => {
                const fallback = references.length
                  ? references[i % references.length]
                  : undefined;
                const sref =
                  step.reference ??
                  (fallback
                    ? { label: fallback.label, url: fallback.url, kind: "doc" as const }
                    : undefined);
                return (
                  <li key={i} className="scroll-mt-24">
                    <h3 className="flex items-baseline gap-2.5 text-base font-semibold text-foreground">
                      <span className="tabular-nums text-primary">{i + 1}.</span>
                      {step.title}
                    </h3>
                    <div className="mt-2 space-y-2 text-[15px] leading-7 text-muted-foreground">
                      {step.body.map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                    {step.code && <CodeBlock snippet={step.code} className="mt-3" />}
                    {step.callout && (
                      <Callout
                        type={step.callout.type}
                        title={step.callout.title}
                        className="mt-3"
                      >
                        {step.callout.body}
                      </Callout>
                    )}
                    {sref && (
                      <a
                        href={sref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        {sref.kind === "video" ? (
                          <VideoIcon className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <BookMarked className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {sref.kind === "video" ? "Watch" : "Reference"}: {sref.label}
                        <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </Section>

          {/* Real SAP example */}
          <Section id="sap-example" title="Real SAP example">
            <p className="text-base font-medium text-foreground">
              {lesson.sapExample.title}
            </p>
            <p className="mt-1.5 text-[15px] leading-7 text-muted-foreground">
              {lesson.sapExample.scenario}
            </p>
            {lesson.sapExample.prompt && (
              <CodeBlock
                className="mt-4"
                snippet={{
                  language: "prompt",
                  filename: "prompt to Claude",
                  code: lesson.sapExample.prompt,
                }}
              />
            )}
            {lesson.sapExample.code && (
              <CodeBlock className="mt-3" snippet={lesson.sapExample.code} />
            )}
            <div className="mt-4 space-y-2 text-[15px] leading-7 text-muted-foreground">
              {lesson.sapExample.explanation.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Section>

          {/* Best practices */}
          <Section id="best-practices" title="Best practices">
            <ul className="space-y-2.5">
              {lesson.bestPractices.map((bp, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[15px] leading-7 text-muted-foreground"
                >
                  <Check className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden />
                  {bp}
                </li>
              ))}
            </ul>
          </Section>

          {/* Common mistakes */}
          <Section id="common-mistakes" title="Common mistakes">
            <ul className="space-y-4">
              {lesson.commonMistakes.map((cm, i) => (
                <li key={i} className="text-[15px] leading-7">
                  <p className="flex items-start gap-2.5 font-medium text-foreground">
                    <X className="mt-1 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    {cm.mistake}
                  </p>
                  <p className="ml-[26px] mt-1 text-muted-foreground">
                    <span className="font-medium text-success">Fix — </span>
                    {cm.fix}
                  </p>
                </li>
              ))}
            </ul>
          </Section>

          {/* Tips */}
          <Section id="tips" title="Tips">
            <ul className="space-y-2.5">
              {lesson.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[15px] leading-7 text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </Section>

          {/* Screenshots (real images only) */}
          {hasScreens && (
            <Section id="screenshots" title="Screenshots">
              <div className="grid gap-5 sm:grid-cols-2">
                {lesson.screenshots
                  .filter((s) => s.imageUrl)
                  .map((s, i) => (
                    <ScreenshotFrame key={i} media={s} />
                  ))}
              </div>
            </Section>
          )}

          {/* Video */}
          <Section id="video" title="Video walkthrough">
            <VideoFrame video={lesson.video} lessonSlug={lesson.slug} />
          </Section>

          {/* Practice exercise */}
          <Section id="exercise" title="Practice exercise">
            <p className="text-base font-medium text-foreground">
              {lesson.exercise.title}
            </p>
            <p className="mt-1.5 text-[15px] leading-7 text-muted-foreground">
              {lesson.exercise.scenario}
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-7 text-muted-foreground">
              {lesson.exercise.tasks.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
            {lesson.exercise.hint && (
              <Callout type="tip" title="Hint" className="mt-4">
                {lesson.exercise.hint}
              </Callout>
            )}
            {lesson.exercise.solution && (
              <Collapsible className="mt-3">
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
          </Section>

          {/* Quiz */}
          <Section id="quiz" title="Knowledge check">
            <Quiz lessonSlug={lesson.slug} questions={lesson.quiz} />
          </Section>

          {/* Summary */}
          <Section id="summary" title="Summary">
            <ul className="space-y-2">
              {lesson.summary.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[15px] leading-7 text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  />
                  {s}
                </li>
              ))}
            </ul>
          </Section>

          {/* References */}
          {references.length > 0 && (
            <Section id="references" title="Official documentation">
              <ul className="space-y-2.5">
                {references.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-baseline gap-2 text-[15px] leading-7"
                    >
                      <ExternalLink className="relative top-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                      <span>
                        <span className="font-medium text-foreground group-hover:text-primary">
                          {r.label}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {r.source}
                        </span>
                        {r.note && (
                          <span className="block text-sm text-muted-foreground">
                            {r.note}
                          </span>
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Related */}
          {lesson.relatedSlugs.length > 0 && (
            <Section id="related" title="Related topics">
              <div className="grid gap-2 sm:grid-cols-2">
                {lesson.relatedSlugs.map((rs) => {
                  const rel = findLesson(rs);
                  if (!rel) return null;
                  return (
                    <Link
                      key={rs}
                      to={`/lessons/${rs}`}
                      className="group rounded-md border border-border px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                    >
                      <p className="text-xs text-muted-foreground">
                        {rel.module.shortTitle}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-foreground group-hover:text-primary">
                        {rel.lesson.title}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </Section>
          )}
        </div>

        {/* Feedback + notes */}
        <div className="no-print mt-12 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              Was this lesson helpful?
            </span>
            <Button
              variant={helpful === "yes" ? "default" : "outline"}
              size="sm"
              onClick={() => setHelpful("yes")}
            >
              <ThumbsUp /> Yes
            </Button>
            <Button
              variant={helpful === "no" ? "default" : "outline"}
              size="sm"
              onClick={() => setHelpful("no")}
            >
              <ThumbsDown /> No
            </Button>
            {helpful && (
              <span className="text-sm text-muted-foreground">
                Thanks for the feedback.
              </span>
            )}
          </div>
          <div className="mt-4">
            <label
              htmlFor="lesson-notes"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Your notes
            </label>
            <div id="lesson-notes">
              <NotesField value={note} onSave={setNote} />
            </div>
          </div>
        </div>

        {/* Prev / next */}
        <nav className="no-print mt-10 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          {prev ? (
            <Link
              to={`/lessons/${prev.lesson.slug}`}
              className="group flex items-center gap-3 rounded-md border border-border px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Previous</span>
                <span className="block truncate text-sm font-medium text-foreground">
                  {prev.lesson.title}
                </span>
              </span>
            </Link>
          ) : (
            <span aria-hidden />
          )}
          {next && (
            <Link
              to={`/lessons/${next.lesson.slug}`}
              className="group flex items-center justify-end gap-3 rounded-md border border-border px-4 py-3 text-right transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Next</span>
                <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">
                  {next.lesson.title}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            </Link>
          )}
        </nav>
      </article>

      {/* Right rail — on this page */}
      <aside className="no-print hidden w-52 shrink-0 xl:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto py-1 scrollbar-thin">
          <OnThisPage items={toc} />
        </div>
      </aside>
    </div>
  );
}
