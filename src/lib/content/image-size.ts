/**
 * The pixel size of a PNG or WebP file, read from its header, so content screenshots get
 * their real width and height (no layout shift, no stretching). Pure, so it is tested.
 */
export function imageSize(file: Uint8Array): { width: number; height: number } | null {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const text = (at: number, length: number) =>
    String.fromCharCode(...file.subarray(at, at + length));

  // PNG: the IHDR chunk comes first, with width and height as big-endian numbers.
  if (file.length >= 24 && file[0] === 0x89 && text(1, 3) === "PNG") {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (file.length >= 30 && text(0, 4) === "RIFF" && text(8, 4) === "WEBP") {
    const chunk = text(12, 4);
    const u24 = (at: number) => file[at]! | (file[at + 1]! << 8) | (file[at + 2]! << 16);
    // Extended (alpha, animation): 24-bit width and height, minus one.
    if (chunk === "VP8X") return { width: u24(24) + 1, height: u24(27) + 1 };
    // Lossy: 14-bit width and height after the frame start code.
    if (chunk === "VP8 ") {
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    }
    // Lossless: 14 bits each, packed after the signature byte.
    if (chunk === "VP8L") {
      const b = file.subarray(21, 25);
      return {
        width: 1 + (((b[1]! & 0x3f) << 8) | b[0]!),
        height: 1 + (((b[3]! & 0x0f) << 10) | (b[2]! << 2) | ((b[1]! & 0xc0) >> 6)),
      };
    }
  }
  return null;
}
