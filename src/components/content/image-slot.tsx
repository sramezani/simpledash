import Image from "next/image";
import type { ReactNode } from "react";
import sizes from "@/lib/content/image-sizes.json";
import { isProduction } from "@/lib/env";

/** Where screenshots for content live: public/content/<id>.webp (or .png). */
const FOLDER = "content";
/** Screenshots are taken at twice the screen size, so they stay sharp on high-density screens. */
const PIXEL_RATIO = 2;

/** The screenshot's address and pixel size, from the list `npm run content:images` writes. */
function findImage(id: string): { src: string; width: number; height: number } | null {
  return (sizes as Record<string, { src: string; width: number; height: number }>)[id] ?? null;
}

/**
 * A screenshot by name (docs/SPEC.md section 30). Until Siamak adds the file, it renders
 * nothing in production and a dashed box with the instructions in development. Every id is
 * listed, with exact instructions, in docs/CONTENT-IMAGES.md (a test keeps them in step), and
 * its size is in image-sizes.json, so nothing is read from disk while a page renders.
 */
export function ImageSlot({
  id,
  alt,
  caption,
  eager = false,
  children,
}: {
  id: string;
  /** What the image shows, for screen readers and search engines. */
  alt: string;
  /** A short line under the image, when it helps the reader. */
  caption?: string;
  /** Near the top of its page, so it loads at once (it's the largest thing on screen). */
  eager?: boolean;
  /** What to capture (development only). */
  children?: ReactNode;
}) {
  const image = findImage(id);
  if (image) {
    // Its real size (no layout shift), shown at its natural width but never wider than the text.
    const shown = Math.round(image.width / PIXEL_RATIO);
    return (
      <figure className="not-prose my-6">
        <Image
          src={image.src}
          alt={alt}
          width={image.width}
          height={image.height}
          sizes={`(min-width: 1024px) ${Math.min(shown, 720)}px, min(${shown}px, 100vw)`}
          style={{ maxWidth: `min(100%, ${shown}px)` }}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          className="h-auto w-full rounded-xl border shadow-xs"
        />
        {caption ? (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  if (isProduction) return null;
  return (
    <figure className="not-prose my-6 rounded-xl border-2 border-dashed border-warning bg-warning/5 p-4 text-sm">
      <p className="font-mono text-xs font-semibold text-warning">[{id}]</p>
      <p className="mt-1 font-medium">{alt}</p>
      {children ? <div className="mt-2 text-muted-foreground">{children}</div> : null}
      <p className="mt-2 text-xs text-muted-foreground">
        Add public/{FOLDER}/{id}.webp to show it. Hidden in production until then.
      </p>
    </figure>
  );
}
