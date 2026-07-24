import { PlayCircle, Youtube } from "lucide-react";
import type { MediaPlaceholder, VideoPlaceholder } from "@/content/types";
import { getLessonVideo } from "@/content/videos";

/**
 * Screenshot frame — renders a REAL image (media.imageUrl). The lesson page
 * only calls this for screenshots that actually have an image, so no
 * placeholder/mockup art is ever shown.
 */
export function ScreenshotFrame({ media }: { media: MediaPlaceholder }) {
  if (!media.imageUrl) return null;
  return (
    <figure className="overflow-hidden rounded-lg border">
      <img
        src={media.imageUrl}
        alt={media.description}
        loading="lazy"
        className="aspect-video w-full bg-muted object-cover"
      />
      <figcaption className="border-t bg-card px-4 py-2 text-xs text-muted-foreground">
        📷 {media.caption}
      </figcaption>
    </figure>
  );
}

/**
 * Video frame — renders a real YouTube embed when the lesson has a mapped
 * video (src/content/videos.ts) or an explicit url in its data; otherwise
 * a styled placeholder.
 */
export function VideoFrame({
  video,
  lessonSlug,
}: {
  video: VideoPlaceholder;
  lessonSlug?: string;
}) {
  const mapped = lessonSlug ? getLessonVideo(lessonSlug) : undefined;
  const url = mapped?.url ?? video.url;

  if (url) {
    return (
      <figure className="overflow-hidden rounded-lg border">
        <div className="aspect-video bg-black">
          <iframe
            src={url}
            title={mapped?.title ?? video.caption}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <figcaption className="flex items-start gap-2 border-t bg-card px-4 py-2 text-xs text-muted-foreground">
          <Youtube className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
          <span>
            {mapped ? (
              <>
                <span className="font-medium text-foreground">{mapped.title}</span>
                {" · "}
                {mapped.channel} (YouTube)
              </>
            ) : (
              video.caption
            )}
          </span>
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
