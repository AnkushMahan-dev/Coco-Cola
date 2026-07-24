import { Youtube } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Callout } from "@/components/lesson/Callout";
import { ReelCard } from "@/components/ReelCard";
import { reels } from "@/content/reels";

/**
 * Standalone "Quick Reels" gallery — every short vertical YouTube clip in one
 * responsive grid. Tapping a reel plays it in a 9:16 modal.
 */
export function ReelsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-10">
      <Breadcrumbs items={[{ label: "Quick Reels" }]} />

      <header className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Quick Reels</h1>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            <Youtube className="h-3.5 w-3.5 text-destructive" aria-hidden />
            YouTube Shorts
          </span>
        </div>
        <p className="text-lg text-muted-foreground">
          Bite-sized, 60-second explainers to warm up on a topic before you dive
          into the full lesson. Tap any reel to play it.
        </p>
      </header>

      <Callout type="tip" title="Where these show up" className="mt-6">
        A matching reel also appears in the “Video walkthrough” section of the
        relevant lessons, so you get the short version right where you're
        learning.
      </Callout>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {reels.map((reel, i) => (
          <ReelCard key={reel.id} reel={reel} index={i} className="w-full" />
        ))}
      </div>
    </div>
  );
}
