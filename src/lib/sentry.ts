import * as Sentry from "@sentry/nextjs";

/**
 * Sentry on the server only (docs/SPEC.md section 20). Nothing personal is sent:
 * no IP addresses, cookies, headers, request bodies or query strings.
 */
export function initSentry(dsn: string | undefined) {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Collect no user info, cookies, headers, bodies or query strings.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    beforeSend(event) {
      if (event.request) {
        delete event.request.headers;
        delete event.request.cookies;
        delete event.request.data;
        delete event.request.query_string;
      }
      delete event.user;
      return event;
    },
  });
}
