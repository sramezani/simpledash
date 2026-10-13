import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { browserIcons, deviceIcons, systemIcons } from "./tech-icons";

describe("tech icons", () => {
  it("has a file in public/icons/tech for every icon it names", () => {
    const names = new Set([
      ...Object.values(browserIcons),
      ...Object.values(systemIcons),
      ...Object.values(deviceIcons),
    ]);
    for (const name of names) {
      const file = fileURLToPath(new URL(`../../public/icons/tech/${name}.svg`, import.meta.url));
      expect(existsSync(file), `${name}.svg is missing: run node scripts/copy-tech-icons.mjs`).toBe(
        true,
      );
    }
  });
});
