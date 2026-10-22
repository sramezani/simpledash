/**
 * Natural Earth outlines are drawn for a round globe: Russia's and Fiji's jump from 180° to
 * -180° halfway round. Flat map tiles (which MapLibre's globe is built from) read that jump as
 * a line across the whole world and fill everything under it. This gives such outlines
 * continuous longitudes instead (Chukotka at 190°, not -170°), which the tiles handle.
 * Outlines that go round a pole (Antarctica's) are left as they are: they need the jump.
 *
 * Plain functions on GeoJSON-shaped arrays, so the globe and `npm run globe:data` share them.
 */

type Position = number[];
type Ring = Position[];
type Polygon = Ring[];

/** Each point moved by whole turns so that no step is longer than half the world. */
export function unwrapRing(ring: Ring): Ring {
  let shift = 0;
  return ring.map((point, i) => {
    if (i > 0) {
      const step = point[0]! - ring[i - 1]![0]!;
      if (step > 180) shift -= 360;
      else if (step < -180) shift += 360;
    }
    return [point[0]! + shift, ...point.slice(1)];
  });
}

const crosses = (ring: Ring) =>
  ring.some((point, i) => i > 0 && Math.abs(point[0]! - ring[i - 1]![0]!) > 180);

const meanLng = (ring: Ring) => ring.reduce((sum, p) => sum + p[0]!, 0) / ring.length;

/** One polygon (outline, then holes) with continuous longitudes, unless it goes round a pole. */
export function fixPolygon(polygon: Polygon): Polygon {
  const [outer, ...holes] = polygon;
  if (!outer || !polygon.some(crosses)) return polygon;
  const unwrapped = unwrapRing(outer);
  const first = unwrapped[0]!;
  const last = unwrapped[unwrapped.length - 1]!;
  // Ends a whole turn apart: the outline circles a pole. Leave it.
  if (Math.abs(last[0]! - first[0]!) > 180) return polygon;
  const centre = meanLng(unwrapped);
  // Holes move by whole turns to sit inside their outline again.
  const fixedHoles = holes.map((hole) => {
    const ring = unwrapRing(hole);
    const turns = Math.round((centre - meanLng(ring)) / 360);
    return turns === 0 ? ring : ring.map((p) => [p[0]! + turns * 360, ...p.slice(1)]);
  });
  return [unwrapped, ...fixedHoles];
}

/** A Polygon or MultiPolygon geometry, fixed. */
export function fixGeometry<
  G extends
    { type: "Polygon"; coordinates: Polygon } | { type: "MultiPolygon"; coordinates: Polygon[] },
>(geometry: G): G {
  return geometry.type === "Polygon"
    ? { ...geometry, coordinates: fixPolygon(geometry.coordinates as Polygon) }
    : { ...geometry, coordinates: (geometry.coordinates as Polygon[]).map(fixPolygon) };
}

/** A longitude back between -180 and 180 (for a label computed on a continuous outline). */
export const normaliseLng = (lng: number) => ((((lng + 180) % 360) + 360) % 360) - 180;
