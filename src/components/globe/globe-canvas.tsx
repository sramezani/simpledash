"use client";

import { useEffect, useRef } from "react";
import { colors } from "@/config/theme";
import type { LivePlace } from "@/lib/ga4/live";
import { hexToUnitRgb } from "@/lib/theme/rgb";

/** cobe's way of turning a place into the globe's rotation. */
function anglesFor(lat: number, lng: number): [number, number] {
  return [Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180];
}

function webglWorks(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The globe itself. cobe (about 5 KB) is imported only when the card is on screen
 * and WebGL works. It doesn't spin when the visitor prefers reduced motion.
 */
export function GlobeCanvas({ places }: { places: LivePlace[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const placesRef = useRef(places);
  const update = useRef<((p: LivePlace[]) => void) | null>(null);

  useEffect(() => {
    placesRef.current = places;
    update.current?.(places);
  }, [places]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let destroy: (() => void) | null = null;
    let frame = 0;
    let cancelled = false;
    let started = false;
    let onScreen = false;
    let spin: (() => void) | null = null;

    const start = async () => {
      if (!webglWorks()) return;
      const { default: createGlobe } = await import("cobe");
      if (cancelled) return;
      const size = el.offsetWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const first = placesRef.current[0];
      let [phi, theta] = first ? anglesFor(first.lat, first.lng) : [0, 0.3];
      theta = Math.max(-0.6, Math.min(0.6, theta));
      const max = () => Math.max(1, ...placesRef.current.map((p) => p.visitors));
      const markers = (list: LivePlace[]) =>
        list.map((p) => ({
          location: [p.lat, p.lng] as [number, number],
          size: 0.03 + 0.06 * (p.visitors / max()),
        }));

      const globe = createGlobe(el, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi,
        theta,
        dark: 0,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: hexToUnitRgb(colors.light.card),
        markerColor: hexToUnitRgb(colors.light.brand),
        glowColor: hexToUnitRgb(colors.light.muted),
        markers: markers(placesRef.current),
      });
      update.current = (list) => globe.update({ markers: markers(list) });
      destroy = () => globe.destroy();
      el.style.opacity = "1";

      if (!still) {
        const step = () => {
          phi += 0.0025;
          globe.update({ phi });
          frame = requestAnimationFrame(step);
        };
        spin = step;
        if (onScreen) frame = requestAnimationFrame(step);
      }
    };

    // Spin only while the globe is on screen; start cobe the first time it is.
    const observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        if (onScreen && !started) {
          started = true;
          void start();
        }
        cancelAnimationFrame(frame);
        if (onScreen && spin) frame = requestAnimationFrame(spin);
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      spin = null;
      observer.disconnect();
      cancelAnimationFrame(frame);
      update.current = null;
      destroy?.();
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="aspect-square w-full max-w-64 opacity-0 transition-opacity duration-200 ease-out"
    />
  );
}
