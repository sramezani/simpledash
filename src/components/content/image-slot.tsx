import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import type { ReactNode } from "react";
import { isProduction } from "@/lib/env";

/** Where screenshots for content live: public/content/<id>.webp (or .png). */
const FOLDER = "content";
const EXTENSIONS = ["webp", "png"] as const;

function findImage(id: string): string | null {
  for (const ext of EXTENSIONS) {
    if (existsSync(join(process.cwd(), "public", FOLDER, `${id}.${ext}`))) {
      return `/${FOLDER}/${id}.${ext}`;
    }
  }
  return null;
}

/**
 * A screenshot by name (docs/SPEC.md section 30). Until Siamak adds the file, it renders
 * nothing in production and a dashed box with the instructions in development. Every id is
 * listed, with exact instructions, in docs/CONTENT-IMAGES.md (a test keeps them in step).
 * Pages are static, so the file check runs at build time.
 */
export function ImageSlot({
  id,
  alt,
  width = 1600,
  height = 1000,
  children,
}: {
  id: string;
  /** What the image shows, for screen readers and search engines. */
  alt: string;
  width?: number;
  height?: number;
  /** What to capture (development only). */
  children?: ReactNode;
}) {
  const src = findImage(id);
  if (src) {
    return (
      <figure className="not-prose my-6">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(min-width: 1024px) 720px, 100vw"
          className="h-auto w-full rounded-xl border shadow-xs"
        />
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
