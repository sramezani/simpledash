"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { dismissEmailNotice, setWeeklyEmail } from "@/lib/email/settings";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { env } from "@/lib/env";

/** Settings and the dashboard notice: turn the Monday email on or off. */
export async function setWeeklyEmailAction(formData: FormData) {
  const user = await requireUser();
  await setWeeklyEmail(user.id, formData.get("weeklyEmail") === "on");
  refresh();
}

/** The dashboard notice's "Got it". */
export async function dismissEmailNoticeAction() {
  const user = await requireUser();
  await dismissEmailNotice(user.id);
  refresh();
}

/** The unsubscribe page's button: works without signing in, with the signed token. */
export async function unsubscribeAction(formData: FormData) {
  const token = formData.get("token");
  const userId = verifyUnsubscribeToken(
    typeof token === "string" ? token : null,
    env.EMAIL_TOKEN_SECRET,
  );
  if (!userId) redirect("/email/unsubscribe?error=1");
  await setWeeklyEmail(userId, false);
  redirect("/email/unsubscribe?done=1");
}
