import { Image as ImageIcon, PlayCircle } from "lucide-react";
import type { MediaPlaceholder, VideoPlaceholder } from "@/content/types";

/**
 * Screenshot placeholder — swap for a real <img> once screenshots
 * are captured; the caption/description double as alt text guidance.
 */
export function ScreenshotFrame({ media }: { media: MediaPlaceholder }) {
  return (
    <figure className="overflow-hidden rounded-lg border">
      <div
        role="img"
        aria-label={media.description}
        className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted to-secondary px-6 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40">
          <ImageIcon className="h-6 w-6 text-muted-foreground/70" aria-hidden />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          {media.description}
        </p>
      </div>
      <figcaption className="border-t bg-card px-4 py-2 text-xs text-muted-foreground">
        📷 {media.caption}
      </figcaption>
    </figure>
  );
}

/** Video placeholder or real embed when a URL is provided. */
export function VideoFrame({ video }: { video: VideoPlaceholder }) {
  if (video.url) {
    return (
      <figure className="overflow-hidden rounded-lg border">
        <div className="aspect-video">
          <iframe
            src={video.url}
            title={video.caption}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <figcaption className="border-t bg-card px-4 py-2 text-xs text-muted-foreground">
          🎥 {video.caption} · {video.duration}
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-lg border">
      <div
        role="img"
        aria-label={video.description}
        className="group relative flex aspect-video flex-col items-center justify-center gap-3 bg-zinc-950 px-6 text-center"
      >
        <PlayCircle
          className="h-14 w-14 text-zinc-500 transition-transform duration-200 group-hover:scale-110"
          aria-hidden
        />
        <p className="max-w-md text-sm text-zinc-400">{video.description}</p>
        <span className="absolute bottom-3 right-3 rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-medium text-zinc-300">
          {video.duration}
        </span>
      </div>
      <figcaption className="border-t bg-card px-4 py-2 text-xs text-muted-foreground">
        🎥 {video.caption}
      </figcaption>
    </figure>
  );
}
