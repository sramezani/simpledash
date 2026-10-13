import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { SIGNED_IN_HINT, SIGNED_IN_HINT_MAX_AGE } from "@/lib/auth/signed-in-hint";

/**
 * Sends signed-out visitors from the app to /signin before anything renders.
 * Only an optimistic cookie check: every page still runs requireUser().
 * It also keeps the "signed in" hint cookie for the landing page in step.
 */
export function proxy(request: NextRequest) {
  const hinted = request.cookies.get(SIGNED_IN_HINT)?.value === "1";
  if (!getSessionCookie(request)) {
    const response = NextResponse.redirect(new URL("/signin", request.url));
    if (hinted) response.cookies.delete(SIGNED_IN_HINT);
    return response;
  }
  const response = NextResponse.next();
  response.cookies.set(SIGNED_IN_HINT, "1", {
    path: "/",
    maxAge: SIGNED_IN_HINT_MAX_AGE,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    // Read by the landing page's inline script, so not HttpOnly. It holds no secret.
    httpOnly: false,
  });
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/sites/:path*", "/settings/:path*", "/admin/:path*"],
};
