import { connection } from "next/server";
import { setWeeklyEmail } from "@/lib/email/settings";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { env } from "@/lib/env";

/**
 * One-click unsubscribe (RFC 8058): email clients POST here with
 * "List-Unsubscribe=One-Click" when the reader presses their Unsubscribe button.
 */
export async function POST(request: Request) {
  await connection();
  const userId = verifyUnsubscribeToken(
    new URL(request.url).searchParams.get("token"),
    env.EMAIL_TOKEN_SECRET,
  );
  if (!userId) return new Response("Invalid link", { status: 400 });
  await setWeeklyEmail(userId, false);
  return new Response("Unsubscribed", { status: 200 });
}
