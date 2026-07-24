import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Youtube } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Reel } from "@/content/reels";
import { cn } from "@/lib/utils";

/**
 * A single vertical reel card with its own 9:16 player modal. Self-contained
 * so it can be dropped into the home strip, the Reels page grid, or a lesson's
 * Video section without sharing state. Falls back to a branded gradient when
 * the YouTube thumbnail can't load (offline / strict CSP).
 */
export function ReelCard({
  reel,
  index = 0,
  className,
}: {
  reel: Reel;
  index?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, ease: "easeOut", delay: Math.min(index * 0.04, 0.25) }}
        className={cn(
          "group relative aspect-[9/16] shrink-0 overflow-hidden rounded-lg border bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className,
        )}
        aria-label={`Play reel: ${reel.title}`}
      >
        {/* Branded fallback shown until (or if) the YouTube thumbnail loads */}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/25 via-transparent to-black/40"
        >
          <Youtube className="h-8 w-8 text-white/25" />
        </span>
        <img
          src={`https://i.ytimg.com/vi/${reel.id}/oardefault.jpg`}
          alt=""
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (!img.dataset.fallback) {
              img.dataset.fallback = "1";
              img.src = `https://i.ytimg.com/vi/${reel.id}/hqdefault.jpg`;
            } else {
              img.style.display = "none";
            }
          }}
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/25" />

        {/* Play button */}
        <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg transition-transform duration-200 group-hover:scale-110">
          <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />
        </span>

        {/* Topic pill */}
        <span className="absolute left-2.5 top-2.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
          {reel.topic}
        </span>

        {/* Caption */}
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3">
          <span className="line-clamp-2 text-sm font-semibold leading-tight text-white">
            {reel.title}
          </span>
          <span className="text-[11px] text-white/70">{reel.author}</span>
        </span>
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[380px] overflow-hidden border-0 bg-black p-0">
          <DialogTitle className="sr-only">{reel.title}</DialogTitle>
          {open && (
            <div className="aspect-[9/16] w-full">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${reel.id}?autoplay=1&playsinline=1`}
                title={reel.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
