import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Callout } from "@/components/lesson/Callout";
import { allLessons, curriculum } from "@/content/curriculum";
import { downloadTextFile, formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function DownloadsPage() {
  const withDownloads = useMemo(
    () => allLessons.filter((r) => r.lesson.download),
    [],
  );

  const [moduleFilter, setModuleFilter] = useState<string>("all");

  // Only show module chips that actually have downloadable files.
  const modulesWithDownloads = useMemo(
    () =>
      curriculum.filter((m) =>
        withDownloads.some((r) => r.module.slug === m.slug),
      ),
    [withDownloads],
  );

  const visible = useMemo(
    () =>
      moduleFilter === "all"
        ? withDownloads
        : withDownloads.filter((r) => r.module.slug === moduleFilter),
    [withDownloads, moduleFilter],
  );

  const downloadAll = () => {
    const combined = visible
      .map((r) => r.lesson.download!)
      .map((d) => `<!-- ${d.filename} -->\n\n${d.content}`)
      .join("\n\n---\n\n");
    const scope =
      moduleFilter === "all"
        ? "all"
        : curriculum.find((m) => m.slug === moduleFilter)?.shortTitle ?? "all";
    downloadTextFile(
      "claude-sap-academy-prompt-packs.md",
      `# Claude AI Academy for SAP Developers — Prompt Pack Collection (${scope})\n\n${combined}`,
    );
  };

  const filters = [
    { slug: "all", label: "All", count: withDownloads.length },
    ...modulesWithDownloads.map((m) => ({
      slug: m.slug,
      label: m.shortTitle,
      count: withDownloads.filter((r) => r.module.slug === m.slug).length,
    })),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-10">
      <Breadcrumbs items={[{ label: "Downloads" }]} />

      <header className="mt-6 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
        <p className="text-lg text-muted-foreground">
          Prompt packs, checklists and templates from every lesson — grab them
          individually or as one bundle. All files are plain Markdown, ideal
          for your team wiki, OneNote or a git repo.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={downloadAll}>
            <Download aria-hidden />{" "}
            {moduleFilter === "all"
              ? "Download all packs (.md)"
              : `Download ${visible.length} pack${visible.length === 1 ? "" : "s"} (.md)`}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden /> Print this list
          </Button>
        </div>
      </header>

      <Callout type="tip" title="Printable PDF guides" className="mt-6">
        Every lesson page has a “Print / Save as PDF” button — it produces a
        clean, navigation-free PDF via your browser's print dialog (choose
        “Save as PDF” as the printer on Windows).
      </Callout>

      {/* Module filter */}
      <div
        className="no-print mt-8 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter downloads by module"
      >
        {filters.map((f) => {
          const active = moduleFilter === f.slug;
          return (
            <button
              key={f.slug}
              type="button"
              onClick={() => setModuleFilter(f.slug)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  active ? "bg-primary-foreground/20" : "bg-muted-foreground/15",
                )}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {visible.map((r, i) => {
          const d = r.lesson.download!;
          const size = formatBytes(d.content);
          return (
            <motion.div
              key={r.lesson.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: (i % 4) * 0.04 }}
            >
              <Card className="flex h-full flex-col">
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-start gap-2 text-base leading-snug">
                      <FileText
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      {d.name}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {r.module.shortTitle}
                    </Badge>
                  </div>
                  <CardDescription className="leading-relaxed">
                    {d.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate font-mono">{d.filename}</span>
                    <span className="shrink-0 tabular-nums">
                      Markdown · {size}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => downloadTextFile(d.filename, d.content)}
                  >
                    <Download aria-hidden /> Download
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No downloads in this module yet.
        </p>
      )}
    </div>
  );
}
