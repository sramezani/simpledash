/**
 * Places that would sit on top of each other on the live globe share one marker
 * (docs/SPEC.md section 11.10). Worked out on screen positions, so places merge when
 * zoomed out and come apart when zoomed in.
 */

export type GroupPlace = { key: string; label: string; visitors: number };
export type PlaceGroup<P extends GroupPlace> = {
  /** Stable while the same places are together, so the marker isn't redrawn. */
  key: string;
  /** The busiest place: the marker stands there. */
  anchor: P;
  /** Busiest first. */
  members: P[];
  visitors: number;
};

/**
 * Greedy, busiest place first: a place joins the first group whose anchor is within
 * `radius` pixels, or starts its own. Places behind the globe (`visible` false) stay alone,
 * so they never pull a marker on the near side.
 */
export function groupPlaces<P extends GroupPlace>(
  places: { place: P; x: number; y: number; visible: boolean }[],
  radius: number,
): PlaceGroup<P>[] {
  const sorted = [...places].sort((a, b) => b.place.visitors - a.place.visitors);
  const groups: { x: number; y: number; visible: boolean; members: P[] }[] = [];
  for (const item of sorted) {
    const near = item.visible
      ? groups.find((g) => g.visible && Math.hypot(g.x - item.x, g.y - item.y) <= radius)
      : undefined;
    if (near) near.members.push(item.place);
    else groups.push({ x: item.x, y: item.y, visible: item.visible, members: [item.place] });
  }
  return groups.map(({ members }) => ({
    key: members
      .map((m) => m.key)
      .sort()
      .join("|"),
    anchor: members[0]!,
    members,
    visitors: members.reduce((sum, m) => sum + m.visitors, 0),
  }));
}

/**
 * Which faces a marker shows: one per place first (so every place in the group is seen),
 * then more from the busiest. Each seed stays the same between updates.
 */
export function faceSeeds(members: GroupPlace[], max: number): string[] {
  const seeds: string[] = [];
  for (let round = 0; seeds.length < max; round++) {
    let added = false;
    for (const m of members) {
      if (round < m.visitors && seeds.length < max) {
        seeds.push(`${m.label}#${round}`);
        added = true;
      }
    }
    if (!added) break;
  }
  return seeds;
}
