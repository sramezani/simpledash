"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { LngLat, Map as MapLibreMap, Marker } from "maplibre-gl";
import type { GeometryCollection } from "topojson-specification";
import { useEffect, useRef, useState } from "react";
import { flagCodes } from "@/config/flags";
import { formatNumber } from "@/lib/format";
import type { LivePlace } from "@/lib/ga4/live";
import { fixGeometry } from "@/lib/globe/antimeridian";
import { faceSeeds, groupPlaces, type PlaceGroup } from "@/lib/globe/groups";
import { cn } from "@/lib/utils";
import { faceFor } from "./faces";
import { globeStyle, type WorldData } from "./globe-style";

type Focus = { place: LivePlace; at: number } | null;
type Pin = { marker: Marker; element: HTMLElement; signature: string };
type Place = LivePlace & { key: string };

/** Faces drawn per marker; more visitors show as "+N". */
const MAX_FACES = 3;
/** Places closer than this on screen (pixels) share a marker. */
const GROUP_RADIUS = 64;
/** Places listed on a shared marker's card; the rest are counted. */
const CARD_ROWS = 4;
/** Degrees the globe turns per second while nobody touches it. */
const SPIN = 2.5;
/** Seconds after the last touch before it turns again. */
const REST = 6;
/** On a computer the panel covers the left side: the globe centres in the rest. */
const PANEL_SPACE = 416;

const placeKey = (p: LivePlace) => `${p.lat},${p.lng}`;

function webglWorks(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Where to look first: the middle of everyone, weighted by visitors (averaged on the sphere). */
function middleOf(places: LivePlace[]): [number, number] {
  if (places.length === 0) return [10, 25];
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of places) {
    const lat = (p.lat * Math.PI) / 180;
    const lng = (p.lng * Math.PI) / 180;
    x += p.visitors * Math.cos(lat) * Math.cos(lng);
    y += p.visitors * Math.cos(lat) * Math.sin(lng);
    z += p.visitors * Math.sin(lat);
  }
  const lng = (Math.atan2(y, x) * 180) / Math.PI;
  const lat = (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI;
  // Tilted no further than this, so the globe never shows a pole head-on.
  return [lng, Math.max(-30, Math.min(40, lat))];
}

/** The zoom at which the globe is about 80% as tall as the space it has. */
function fitZoom(width: number, height: number): number {
  const room = Math.min(width, height);
  return Math.max(0.2, Math.log2((0.8 * room * Math.PI) / 512));
}

/**
 * The live globe (docs/SPEC.md section 11.10): MapLibre with SimpleDash's own map data
 * (public/globe), a face for each visitor at their city, and a card with the place on
 * hover. It turns slowly until touched (not at all with reduced motion), and flies to a
 * place picked in the panel. Without WebGL it stays empty: the panel has every number.
 */
export function LiveGlobe({ places, focus }: { places: LivePlace[]; focus: Focus }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const makeMarker = useRef<((element: HTMLElement) => Marker) | null>(null);
  const pins = useRef(new Map<string, Pin>());
  const regroup = useRef<(() => void) | null>(null);
  /** The place picked in the panel, whose card shows until `until`. */
  const active = useRef<{ key: string; until: number } | null>(null);
  const touched = useRef(0);
  const placesRef = useRef(places);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  // The map, once.
  useEffect(() => {
    const el = container.current;
    if (!el || !webglWorks()) return;
    let cancelled = false;
    let frame = 0;
    let observer: ResizeObserver | null = null;

    void (async () => {
      const [maplibregl, { feature }, world] = await Promise.all([
        import("maplibre-gl"),
        import("topojson-client"),
        fetch("/globe/world.json").then((r) => r.json() as Promise<WorldData>),
      ]);
      if (cancelled) return;
      // MapLibre draws in a worker; the bundler serves its file from the installed package.
      maplibregl.setWorkerUrl(
        new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href,
      );

      // Russia's and Fiji's outlines cross 180°: see src/lib/globe/antimeridian.ts.
      const shapes = feature(
        world.countries,
        world.countries.objects.countries as GeometryCollection,
      );
      const countries: FeatureCollection = {
        ...shapes,
        features: shapes.features.map((f) => ({
          ...f,
          geometry: fixGeometry(f.geometry as Polygon | MultiPolygon),
        })),
      };
      const labels: FeatureCollection = {
        type: "FeatureCollection",
        features: world.labels.map((l) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [l.lng, l.lat] },
          properties: { name: l.name, size: l.size },
        })),
      };

      const wide = () => el.clientWidth >= 768;
      const roomWidth = () => el.clientWidth - (wide() ? PANEL_SPACE : 0);
      const map = new maplibregl.Map({
        container: el,
        style: globeStyle(countries, labels),
        center: middleOf(placesRef.current),
        zoom: fitZoom(roomWidth(), el.clientHeight),
        minZoom: 0.2,
        maxZoom: 5.5,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        keyboard: false,
        renderWorldCopies: false,
      });
      map.touchZoomRotate.disableRotation();
      map.setPadding({ left: wide() ? PANEL_SPACE : 0, top: 0, right: 0, bottom: 0 });
      // The panel lists everything the globe shows, so the canvas isn't a tab stop.
      map.getCanvas().tabIndex = -1;
      mapRef.current = map;
      makeMarker.current = (element) =>
        new maplibregl.Marker({ element, anchor: "center", opacityWhenCovered: 0 });

      const touch = () => (touched.current = performance.now());
      for (const type of ["mousedown", "touchstart", "wheel", "dragstart"] as const) {
        map.on(type, touch);
      }

      observer = new ResizeObserver(() => {
        map.resize();
        map.setPadding({ left: wide() ? PANEL_SPACE : 0, top: 0, right: 0, bottom: 0 });
      });
      observer.observe(el);

      map.once("load", () => {
        if (cancelled) return;
        el.dataset.ready = "";
        // Markers are grouped again after a zoom, and now and then while the globe turns.
        regroup.current = () => {
          if (makeMarker.current) {
            syncPins(map, makeMarker.current, pins.current, placesRef.current, active.current);
          }
        };
        let grouped = 0;
        map.on("zoomend", () => regroup.current?.());
        map.on("move", () => {
          const now = performance.now();
          if (now - grouped < 400) return;
          grouped = now;
          regroup.current?.();
        });
        setReady(true);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        let previous = performance.now();
        const spin = (now: number) => {
          const dt = (now - previous) / 1000;
          previous = now;
          const resting = now - touched.current > REST * 1000;
          if (resting && !map.isMoving() && !document.hidden) {
            const center = map.getCenter();
            map.jumpTo({ center: [center.lng - SPIN * dt, center.lat] });
          }
          frame = requestAnimationFrame(spin);
        };
        frame = requestAnimationFrame(spin);
      });
    })();

    const current = pins.current;
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Faces follow the numbers: new places pop in, gone ones leave, counts update in place.
  useEffect(() => {
    if (ready) regroup.current?.();
  }, [places, ready]);

  // A place picked in the panel: fly there and show its card for a moment.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !focus) return;
    touched.current = performance.now();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = {
      center: [focus.place.lng, focus.place.lat] as [number, number],
      zoom: Math.max(map.getZoom(), 2.6),
    };
    if (still) map.jumpTo(target);
    else map.flyTo({ ...target, duration: 1600, essential: false });
    active.current = { key: placeKey(focus.place), until: performance.now() + 4500 };
    regroup.current?.();
    const timer = setTimeout(() => regroup.current?.(), 4600);
    return () => clearTimeout(timer);
  }, [focus, ready]);

  // MapLibre's own styles make its container `position: relative`, so it fills a wrapper.
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-700 ease-out has-data-ready:opacity-100",
        "[&_.maplibregl-canvas]:outline-none",
      )}
    >
      <div ref={container} className="size-full" />
    </div>
  );
}

/** Degrees between two points on the globe. */
function degreesApart(a: LngLat, lng: number, lat: number): number {
  const rad = Math.PI / 180;
  const cos =
    Math.sin(a.lat * rad) * Math.sin(lat * rad) +
    Math.cos(a.lat * rad) * Math.cos(lat * rad) * Math.cos((a.lng - lng) * rad);
  return Math.acos(Math.max(-1, Math.min(1, cos))) / rad;
}

/**
 * Brings the markers in line with the places: grouped by where they land on screen, a
 * marker per group, redrawn only when its places or counts change.
 */
function syncPins(
  map: MapLibreMap,
  make: (element: HTMLElement) => Marker,
  pins: Map<string, Pin>,
  places: LivePlace[],
  active: { key: string; until: number } | null,
) {
  const centre = map.getCenter();
  const groups = groupPlaces(
    places.map((p) => {
      const point = map.project([p.lng, p.lat]);
      return {
        place: { ...p, key: placeKey(p) },
        x: point.x,
        y: point.y,
        visible: degreesApart(centre, p.lng, p.lat) < 85,
      };
    }),
    GROUP_RADIUS,
  );
  const showing = active && active.until > performance.now() ? active.key : null;
  const seen = new Set<string>();
  for (const group of groups) {
    seen.add(group.key);
    const signature = group.members.map((m) => `${m.key}:${m.visitors}`).join("|");
    let pin = pins.get(group.key);
    if (!pin) {
      const element = document.createElement("div");
      fillPin(element, group);
      const marker = make(element).setLngLat([group.anchor.lng, group.anchor.lat]).addTo(map);
      pin = { marker, element, signature };
      pins.set(group.key, pin);
    } else if (pin.signature !== signature) {
      fillPin(pin.element, group);
      pin.signature = signature;
    }
    if (showing && group.members.some((m) => m.key === showing)) pin.element.dataset.active = "";
    else delete pin.element.dataset.active;
  }
  for (const [key, pin] of pins) {
    if (seen.has(key)) continue;
    pin.marker.remove();
    pins.delete(key);
  }
}

const visitorsWord = (n: number) => `${formatNumber(n)} ${n === 1 ? "visitor" : "visitors"}`;

function flagImage(countryCode: string): HTMLImageElement | null {
  const code = countryCode.toUpperCase();
  if (!flagCodes.has(code)) return null;
  const img = document.createElement("img");
  img.src = `/flags/${code.toLowerCase()}.svg`;
  img.alt = "";
  img.className = "aspect-3/2 w-4 shrink-0 rounded-[2px] shadow-xs";
  return img;
}

/**
 * One marker: up to three faces (a soft pulse behind them), "+N" for the rest, and a card
 * with each place, its flag and count on hover or when picked in the panel. Built as plain
 * elements because MapLibre places them itself; text goes in as text, never as HTML.
 */
function fillPin(root: HTMLElement, group: PlaceGroup<Place>) {
  root.className = "group relative flex items-center";
  root.replaceChildren();

  const pulse = document.createElement("span");
  pulse.className =
    "absolute inset-0 rounded-full bg-card/50 motion-safe:animate-ping [animation-duration:3s]";
  const stack = document.createElement("span");
  stack.className = "relative flex -space-x-3";
  const seeds = faceSeeds(group.members, MAX_FACES);
  for (const seed of seeds) {
    const img = document.createElement("img");
    img.src = faceFor(seed);
    img.alt = "";
    img.className =
      "size-9 rounded-full bg-card shadow-md ring-2 ring-card animate-in fade-in zoom-in-50 duration-300";
    stack.append(img);
  }
  if (group.visitors > seeds.length) {
    const more = document.createElement("span");
    more.className =
      "relative z-10 flex h-7 min-w-7 items-center justify-center self-center rounded-full bg-card px-1.5 text-xs font-semibold text-card-foreground tabular-nums shadow-md ring-2 ring-card";
    more.textContent = `+${formatNumber(group.visitors - seeds.length)}`;
    stack.append(more);
  }

  const card = document.createElement("span");
  card.className =
    "pointer-events-none absolute bottom-full left-1/2 mb-2.5 flex -translate-x-1/2 translate-y-1 flex-col gap-1 rounded-lg bg-card px-2.5 py-2 text-xs whitespace-nowrap text-card-foreground opacity-0 shadow-lg transition duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-data-active:translate-y-0 group-data-active:opacity-100";
  for (const member of group.members.slice(0, CARD_ROWS)) {
    const row = document.createElement("span");
    row.className = "flex items-center gap-1.5";
    const flag = flagImage(member.countryCode);
    if (flag) row.append(flag);
    const name = document.createElement("span");
    name.className = "font-medium";
    name.textContent = member.label;
    const count = document.createElement("span");
    count.className = "ml-auto pl-3 text-muted-foreground tabular-nums";
    count.textContent = visitorsWord(member.visitors);
    row.append(name, count);
    card.append(row);
  }
  const rest = group.members.length - CARD_ROWS;
  if (rest > 0) {
    const more = document.createElement("span");
    more.className = "text-muted-foreground";
    more.textContent = `and ${rest} more ${rest === 1 ? "place" : "places"}`;
    card.append(more);
  }

  root.append(pulse, stack, card);
}
