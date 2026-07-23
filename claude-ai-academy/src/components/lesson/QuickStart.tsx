import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Rocket, ArrowDown } from "lucide-react";
import type { Step } from "@/content/types";
import { cn } from "@/lib/utils";

const COMMAND_LANGS = new Set(["bash", "powershell", "shell", "cmd", "sh"]);

/**
 * "Do this now" box — the practical spine of a lesson, derived from its
 * step titles plus the first real command found in the steps. It gives a
 * beginner an immediate, copy-paste path before any theory.
 */
export function QuickStart({ steps }: { steps: Step[] }) {
  const [copied, setCopied] = useState(false);

  const titles = steps.map((s) => s.title);
  const shown = titles.slice(0, 5);
  const extra = titles.length - shown.length;

  const firstCommand = steps
    .map((s) => s.code)
    .find((c) => c && COMMAND_LANGS.has(c.language.toLowerCase()));

  const copy = async () => {
    if (!firstCommand) return;
    try {
      await navigator.clipboard.writeText(firstCommand.code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = firstCommand.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border accent-border bg-gradient-to-br from-[hsl(var(--ah)/0.08)] to-transparent"
    >
      <div className="flex items-center gap-2.5 border-b accent-border px-5 py-3">
        <motion.span
          initial={{ rotate: -12, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
          className="flex h-8 w-8 items-center justify-center rounded-lg accent-chip"
        >
          <Rocket className="h-4 w-4" aria-hidden />
        </motion.span>
        <div>
          <p className="text-sm font-bold leading-tight">Do this now</p>
          <p className="text-xs text-muted-foreground">
            The fast path — full walkthrough is below.
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <ol className="space-y-2">
          {shown.map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-snug">
              <span
                aria-hidden
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full accent-chip text-[11px] font-bold"
              >
                {i + 1}
              </span>
              {t}
            </li>
          ))}
          {extra > 0 && (
            <li className="pl-[30px] text-xs text-muted-foreground">
              + {extra} more step{extra > 1 ? "s" : ""} below
            </li>
          )}
        </ol>

        {firstCommand && (
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {firstCommand.filename ?? "Run this"}
              </span>
              <button
                type="button"
                onClick={copy}
                aria-label={copied ? "Copied" : "Copy command"}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-success animate-pop-in" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-[12.5px] leading-relaxed text-zinc-100 scrollbar-thin">
              <code className="font-mono">{firstCommand.code}</code>
            </pre>
          </div>
        )}
      </div>

      <a
        href="#steps"
        onClick={(e) => {
          // HashRouter owns the URL hash, so scroll in JS instead of letting
          // the browser treat "#steps" as a route change.
          e.preventDefault();
          document
            .getElementById("steps")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        className={cn(
          "flex items-center justify-center gap-1.5 border-t accent-border py-2.5 text-xs font-medium accent-text transition-colors hover:bg-[hsl(var(--ah)/0.06)]",
        )}
      >
        Full step-by-step guide
        <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" aria-hidden />
      </a>
    </motion.div>
  );
}
