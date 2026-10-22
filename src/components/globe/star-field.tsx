/** A small seeded random generator, so the stars sit in the same places on every render. */
function seeded(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seeded(11);
const stars = Array.from({ length: 160 }, () => ({
  x: Math.round(random() * 1600),
  y: Math.round(random() * 1000),
  r: random() < 0.85 ? 0.7 + random() * 0.5 : 1.3 + random() * 0.6,
  o: 0.25 + random() * 0.65,
}));

/** The night sky behind the live globe: still dots and a soft glow in the middle. */
export function StarField() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-radial from-globe-glow/12 via-globe-space/0 to-globe-space/0" />
      <svg
        className="absolute inset-0 size-full text-card"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="currentColor" opacity={s.o} />
        ))}
      </svg>
    </div>
  );
}
