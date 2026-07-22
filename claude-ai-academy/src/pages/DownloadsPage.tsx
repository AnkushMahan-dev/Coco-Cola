import { motion } from "framer-motion";
import { Download, FileText, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Callout } from "@/components/lesson/Callout";
import { allLessons } from "@/content/curriculum";
import { downloadTextFile } from "@/lib/utils";

export function DownloadsPage() {
  const withDownloads = allLessons.filter((r) => r.lesson.download);

  const downloadAll = () => {
    const combined = withDownloads
      .map((r) => r.lesson.download!)
      .map((d) => `<!-- ${d.filename} -->\n\n${d.content}`)
      .join("\n\n---\n\n");
    downloadTextFile(
      "claude-sap-academy-all-prompt-packs.md",
      `# Claude AI Academy for SAP Developers — Complete Prompt Pack Collection\n\n${combined}`,
    );
  };

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
            <Download aria-hidden /> Download all packs (.md)
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {withDownloads.map((r, i) => {
          const d = r.lesson.download!;
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
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => downloadTextFile(d.filename, d.content)}
                  >
                    <Download aria-hidden /> {d.filename}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
