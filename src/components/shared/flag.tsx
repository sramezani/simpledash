import Image from "next/image";
import { flagCodes } from "@/config/flags";

/** A country's flag, a self-hosted SVG (emoji flags don't show on Windows). Nothing for unknown codes. */
export function Flag({ code }: { code: string }) {
  const upper = code.toUpperCase();
  if (!flagCodes.has(upper)) return null;
  return (
    <Image
      src={`/flags/${upper.toLowerCase()}.svg`}
      alt=""
      width={16}
      height={11}
      loading="lazy"
      unoptimized
      className="aspect-3/2 h-auto w-4 rounded-[2px] shadow-xs"
    />
  );
}
