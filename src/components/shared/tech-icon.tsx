import { CircleHelpIcon, GlobeIcon } from "lucide-react";
import Image from "next/image";

/**
 * A browser, operating system or device icon from public/icons/tech
 * (src/config/tech-icons.ts names them), or a plain one for anything else:
 * a globe for a browser, a question mark otherwise.
 */
export function TechIcon({
  name,
  fallback = "help",
}: {
  name: string | null | undefined;
  fallback?: "globe" | "help";
}) {
  if (!name) {
    const Icon = fallback === "globe" ? GlobeIcon : CircleHelpIcon;
    return <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />;
  }
  return (
    <Image
      src={`/icons/tech/${name}.svg`}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      unoptimized
      className="size-4 object-contain"
    />
  );
}
