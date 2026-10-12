import Image from "next/image";
import { flagCodes } from "@/config/flags";

/** A country's flag, self-hosted (emoji flags don't show on Windows). Nothing for unknown codes. */
export function Flag({ code }: { code: string }) {
  const upper = code.toUpperCase();
  if (!flagCodes.has(upper)) return null;
  return (
    <Image
      src={`/flags/${upper.toLowerCase()}.png`}
      alt=""
      width={16}
      height={12}
      loading="lazy"
      unoptimized
      className="h-3 w-4 rounded-[2px] object-cover shadow-xs"
    />
  );
}
