import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AtSign,
  Blocks,
  Boxes,
  Briefcase,
  Cable,
  Check,
  Chrome,
  Code2,
  ExternalLink,
  PenTool,
  Puzzle,
  Rocket,
  Sheet,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ecosystem, type EcosystemItem } from "@/content/ecosystem";
import { findLesson } from "@/content/curriculum";

// Map the ecosystem items' emoji field to real SVG icons — no emoji as
// structural icons (professional UI guideline).
const ecosystemIcons: Record<string, typeof Rocket> = {
  "🧠": Sparkles,
  "💻": Code2,
  "🤝": Users,
  "💬": AtSign,
  "🌐": Chrome,
  "📊": Sheet,
  "🧩": Puzzle,
  "🧰": Briefcase,
  "🎨": PenTool,
  "🔗": Cable,
  "🔌": Blocks,
  "📚": Boxes,
};

const GROUP_ORDER: EcosystemItem["group"][] = [
  "Meet Claude",
  "Products",
  "Features",
  "Explore",
];

const GROUP_BLURB: Record<EcosystemItem["group"], string> = {
  "Meet Claude": "Start here — what Claude is and who it's built for.",
  Products: "The core products you'll use day to day as an SAP developer.",
  Features: "Where Claude plugs into the tools you already work in.",
  Explore: "Extend and connect Claude across your wider toolchain.",
};

function EcosystemCard({ item, index }: { item: EcosystemItem; index: number }) {
  const Icon = ecosystemIcons[item.icon] ?? Boxes;
  const covered = item.lessonSlug ? findLesson(item.lessonSlug) : undefined;
  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: (index % 3) * 0.04 }}
      className="group flex flex-col gap-2.5 rounded-lg border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md accent-chip">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {item.group}
          </p>
          <p className="font-semibold leading-tight text-foreground group-hover:text-primary">
            {item.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{item.domain}</p>
        </div>
        <ExternalLink
          className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
          aria-hidden
        />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{item.blurb}</p>
      {covered && (
        <Link
          to={`/lessons/${covered.lesson.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-auto flex items-center gap-1.5 pt-1 text-xs font-medium text-primary hover:underline"
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          Covered here: {covered.lesson.title}
        </Link>
      )}
    </motion.a>
  );
}

export function EcosystemPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-10">
      <Breadcrumbs items={[{ label: "Claude Ecosystem" }]} />

      <header className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            Ecosystem
          </span>
          <h1 className="text-3xl font-bold tracking-tight">
            Explore the Claude ecosystem
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Every product &amp; feature from the{" "}
            <span className="font-medium text-foreground">claude.com</span>{" "}
            navigation — official pages, plus where each is covered in this
            Academy.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 py-1">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Opens claude.com
        </Badge>
      </header>

      <div className="mt-8 space-y-10">
        {GROUP_ORDER.map((group) => {
          const items = ecosystem.filter((it) => it.group === group);
          if (items.length === 0) return null;
          return (
            <section key={group}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold tracking-tight">{group}</h2>
                <p className="text-sm text-muted-foreground">
                  {GROUP_BLURB[group]}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, i) => (
                  <EcosystemCard key={item.url} item={item} index={i} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/40 p-6">
        <div>
          <p className="font-semibold">Ready to put these to work?</p>
          <p className="text-sm text-muted-foreground">
            Follow the structured curriculum from your first prompt to
            AI-assisted S/4HANA delivery.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Go to the learning path <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
