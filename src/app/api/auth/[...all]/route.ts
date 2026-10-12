import { auth } from "@/lib/auth/auth";
import { isPublicAuthPath } from "@/lib/auth/routes";

// Better Auth over HTTP: only Google's callback (see src/lib/auth/routes.ts).
function handle(request: Request) {
  if (!isPublicAuthPath(new URL(request.url).pathname)) {
    return new Response("Not found", { status: 404 });
  }
  return auth.handler(request);
}

export const GET = handle;
export const POST = handle;
