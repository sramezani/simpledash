import { GlobeIcon, LinkIcon } from "lucide-react";
import Image from "next/image";

/**
 * A source's site icon through our cached proxy (docs/SPEC.md section 19), or a
 * generic icon when the source isn't a site.
 */
export function SiteIcon({ domain, direct }: { domain: string | null; direct?: boolean }) {
  if (direct) return <LinkIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />;
  if (!domain) return <GlobeIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />;
  return (
    <Image
      src={`/api/icon/${domain}`}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      unoptimized
      className="size-4 rounded-sm"
    />
  );
}
