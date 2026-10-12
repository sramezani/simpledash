"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * When cached numbers were stale, a refresh runs in the background. This reloads
 * the page's data once, about 4 seconds later, to show the new numbers
 * (docs/SPEC.md section 10.3). `token` changes only when new data arrives.
 */
export function RefreshSoon({ token }: { token: string }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => router.refresh(), 4000);
    return () => clearTimeout(timer);
  }, [router, token]);
  return null;
}
