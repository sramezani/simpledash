"use client";

import { useEffect } from "react";

/**
 * Scrolls to the URL's #section once streamed content is in. The browser's own jump
 * happens before a Suspense boundary fills in, so links like /settings/sites/<id>#search miss.
 */
export function ScrollToHash() {
  useEffect(() => {
    let id = window.location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      // A malformed hash: look it up as it is.
    }
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
  return null;
}
