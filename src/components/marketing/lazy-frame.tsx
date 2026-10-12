"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * An iframe that starts loading when it comes near the screen, then fades in over
 * its placeholder. Keeps the demo's own page work out of the landing page's first load.
 */
export function LazyFrame({
  src,
  title,
  children,
}: {
  src: string;
  title: string;
  /** The placeholder shown until the page inside has loaded. */
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className="relative h-full w-full">
      <div
        aria-hidden={loaded}
        className={cn(
          "absolute inset-0 transition-opacity duration-500 ease-out",
          loaded && "pointer-events-none opacity-0",
        )}
      >
        {children}
      </div>
      {near ? (
        <iframe
          src={src}
          title={title}
          onLoad={() => setLoaded(true)}
          className={cn(
            "absolute inset-0 h-full w-full border-0 bg-background transition-opacity duration-500 ease-out",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
    </div>
  );
}
