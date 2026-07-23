import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Youtube } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { reels, type Reel } from "@/content/reels";

/**
 * "Quick Reels" — a horizontally scrollable strip of short vertical YouTube
 * clips. Tapping a reel opens a 9:16 player in a modal. Purely an engaging
 * discovery surface; the full lessons carry the real teaching.
 */
export function Reels() {
  const [active, setActive] = useState<Reel | null>(null);

  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-14 lg:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-bold tracking-tight"
            >
              Quick reels
            </motion.h2>
            <p className="text-muted-foreground">
              60-second explainers — tap one, watch, get the gist. Then dive
              into the full lesson.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            <Youtube className="h-3.5 w-3.5 text-destructive" aria-hidden />
            Shorts
          </span>
        </div>

        {/* Scrollable reel strip */}
        <div
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 scrollbar-thin lg:-mx-10 lg:px-10"
          role="list"
        >
          {reels.map((reel, i) => (
            <motion.button
              key={reel.id}
              type="button"
              role="listitem"
              onClick={() => setActive(reel)}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, ease: "easeOut", delay: Math.min(i * 0.04, 0.25) }}
              className="group relative aspect-[9/16] w-[164px] shrink-0 snap-start overflow-hidden rounded-lg border bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                    // Both thumbnails blocked (offline/CSP): let the branded
                    // fallback show instead of a broken-image box.
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
          ))}
        </div>
      </div>

      {/* Player modal */}
      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-[380px] overflow-hidden border-0 bg-black p-0">
          <DialogTitle className="sr-only">
            {active?.title ?? "Reel"}
          </DialogTitle>
          {active && (
            <div className="aspect-[9/16] w-full">
              <iframe
                key={active.id}
                src={`https://www.youtube-nocookie.com/embed/${active.id}?autoplay=1&playsinline=1`}
                title={active.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
