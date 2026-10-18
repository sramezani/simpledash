import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { imageSize } from "./image-size";
import sizes from "./image-sizes.json";

const bytes = (length: number, set: (b: Uint8Array, v: DataView) => void) => {
  const b = new Uint8Array(length);
  set(b, new DataView(b.buffer));
  return b;
};
const ascii = (b: Uint8Array, at: number, s: string) =>
  [...s].forEach((c, i) => (b[at + i] = c.charCodeAt(0)));

describe("imageSize", () => {
  it("reads a PNG", () => {
    const png = bytes(24, (b, v) => {
      b[0] = 0x89;
      ascii(b, 1, "PNG");
      v.setUint32(16, 1600);
      v.setUint32(20, 900);
    });
    expect(imageSize(png)).toEqual({ width: 1600, height: 900 });
  });

  it("reads lossy, lossless and extended WebP", () => {
    const webp = (chunk: string, set: (b: Uint8Array, v: DataView) => void) =>
      bytes(40, (b, v) => {
        ascii(b, 0, "RIFF");
        ascii(b, 8, "WEBP");
        ascii(b, 12, chunk);
        set(b, v);
      });
    const lossy = webp("VP8 ", (_, v) => {
      v.setUint16(26, 1600, true);
      v.setUint16(28, 1071, true);
    });
    const extended = webp("VP8X", (b) => {
      b[24] = (1408 - 1) & 0xff;
      b[25] = (1408 - 1) >> 8;
      b[27] = (1416 - 1) & 0xff;
      b[28] = (1416 - 1) >> 8;
    });
    // 736 × 472: width-1 and height-1 packed as 14 bits each.
    const w = 735;
    const h = 471;
    const lossless = webp("VP8L", (b) => {
      b[21] = w & 0xff;
      b[22] = ((w >> 8) & 0x3f) | ((h & 0x3) << 6);
      b[23] = (h >> 2) & 0xff;
      b[24] = (h >> 10) & 0x0f;
    });
    expect(imageSize(lossy)).toEqual({ width: 1600, height: 1071 });
    expect(imageSize(extended)).toEqual({ width: 1408, height: 1416 });
    expect(imageSize(lossless)).toEqual({ width: 736, height: 472 });
  });

  it("returns null for anything else", () => {
    expect(imageSize(new Uint8Array(40))).toBeNull();
  });

  it("has every screenshot in public/content in image-sizes.json, with its real size", () => {
    const folder = join(process.cwd(), "public", "content");
    const listed = sizes as Record<string, { src: string; width: number; height: number }>;
    const files = readdirSync(folder).filter((f) => /\.(webp|png)$/.test(f));
    for (const file of files) {
      const id = file.replace(/\.(webp|png)$/, "");
      expect(listed[id], `${file}: run npm run content:images`).toEqual({
        src: `/content/${file}`,
        ...imageSize(readFileSync(join(folder, file))),
      });
    }
    expect(Object.keys(listed).sort(), "image-sizes.json lists a file that's gone").toEqual(
      files.map((f) => f.replace(/\.(webp|png)$/, "")).sort(),
    );
  });
});
