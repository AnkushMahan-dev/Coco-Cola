import { useState } from "react";
import { Check, Copy, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeSnippet } from "@/content/types";

/**
 * Interactive code block with a language header and one-click copy —
 * used for ABAP snippets, prompts, shell commands, and JSON configs.
 */
export function CodeBlock({
  snippet,
  className,
}: {
  snippet: CodeSnippet;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
    } catch {
      // Clipboard API unavailable (e.g. http): fall back to a temp textarea.
      const ta = document.createElement("textarea");
      ta.value = snippet.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100 dark:border-zinc-800",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <TerminalSquare className="h-3.5 w-3.5" aria-hidden />
          <span className="font-medium uppercase tracking-wide">
            {snippet.language}
          </span>
          {snippet.filename && (
            <>
              <span aria-hidden>·</span>
              <span className="font-mono">{snippet.filename}</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code to clipboard"}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400 animate-pop-in" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed scrollbar-thin">
        <code className="font-mono">{snippet.code}</code>
      </pre>
    </div>
  );
}
