import { connection } from "next/server";
import { isUserLocked } from "@/lib/billing/billing";
import { getActiveSite, getApiUser } from "@/lib/auth/session";
import { classifyError } from "@/lib/ga4/errors";
import { getLive } from "@/lib/ga4/realtime";

const noStore = { "Cache-Control": "private, no-store" };

/** Live data for the signed-in user's own site (docs/SPEC.md section 11.10). */
export async function GET() {
  await connection();
  const user = await getApiUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401, headers: noStore });
  if (await isUserLocked(user.id)) {
    return Response.json(
      { error: "Your free trial has ended." },
      { status: 402, headers: noStore },
    );
  }
  const site = await getActiveSite(user.id);
  if (!site || site.status !== "ok") {
    return Response.json({ error: "No site to show." }, { status: 409, headers: noStore });
  }
  try {
    return Response.json(await getLive(site), { headers: noStore });
  } catch (error) {
    const { problem } = classifyError(error);
    return Response.json({ error: problem }, { status: 503, headers: noStore });
  }
}
