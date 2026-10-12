/**
 * A small cookie that only says "this browser is signed in", so the landing page
 * can show "Dashboard" instead of "Sign in" (docs/SPEC.md section 17). The landing
 * page stays static and cacheable: a tiny inline script reads the cookie before
 * the first paint and marks `<html data-signed-in>`. It is a hint, never a check:
 * every signed-in page still runs requireUser().
 */

export const SIGNED_IN_HINT = "sd_signed_in";

/** Same lifetime as a session (30 days), renewed whenever the app is opened. */
export const SIGNED_IN_HINT_MAX_AGE = 60 * 60 * 24 * 30;

/** Runs in `<head>` before the page paints. Plain ES5 on purpose. */
export const signedInHintScript = `document.cookie.split("; ").indexOf("${SIGNED_IN_HINT}=1")>-1&&document.documentElement.setAttribute("data-signed-in","")`;
