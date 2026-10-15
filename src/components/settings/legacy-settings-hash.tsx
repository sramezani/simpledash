"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Old one-page settings anchors that are pages of their own now. */
const MOVED: Record<string, Route> = {
  "#billing": "/settings/billing",
  "#email": "/settings/email",
};

/**
 * Settings used to be one page (until Oct 15, 2026). Emails already sent link to
 * /settings#email, and a hash never reaches the server, so the move happens here.
 */
export function LegacySettingsHash() {
  const router = useRouter();
  useEffect(() => {
    const to = MOVED[window.location.hash];
    if (to) router.replace(to);
  }, [router]);
  return null;
}
