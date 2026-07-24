import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Youtube } from "lucide-react";
import { reels } from "@/content/reels";
import { ReelCard } from "@/components/ReelCard";

/**
 * "Quick Reels" — a horizontally scrollable strip of short vertical YouTube
 * clips on the home page. Purely an engaging discovery surface; the full
 * lessons carry the real teaching. See the Reels page for the full grid.
 */
export function Reels() {
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
            <ReelCard
              key={reel.id}
              reel={reel}
              index={i}
              className="w-[164px] snap-start"
            />
          ))}
        </div>

        <Link
          to="/reels"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Browse all reels <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
