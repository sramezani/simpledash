import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { SIGNED_IN_HINT, SIGNED_IN_HINT_MAX_AGE } from "@/lib/auth/signed-in-hint";

/**
 * Sends signed-out visitors from the app to /signin, and signed-in ones from /signin to
 * the dashboard, before anything renders. Only an optimistic cookie check: every page
 * still runs requireUser(). It also keeps the "signed in" hint cookie for the landing
 * page in step.
 */
export function proxy(request: NextRequest) {
  const hinted = request.cookies.get(SIGNED_IN_HINT)?.value === "1";
  const hasSession = Boolean(getSessionCookie(request));
  if (request.nextUrl.pathname === "/signin") {
    // Any query (?expired, ?error, ?disconnected) means the app sent the visitor here on
    // purpose, often with a cookie whose session is gone: show the page, or it would loop.
    if (hasSession && !request.nextUrl.search) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    const response = NextResponse.next();
    if (hinted && !hasSession) response.cookies.delete(SIGNED_IN_HINT);
    return response;
  }
  if (!hasSession) {
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
  matcher: ["/dashboard/:path*", "/settings/:path*", "/admin/:path*", "/signin"],
};
