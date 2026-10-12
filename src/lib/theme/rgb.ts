/** "#4A42DB" → [0.29, 0.26, 0.86], for WebGL colours (the live globe). */
export function hexToUnitRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
