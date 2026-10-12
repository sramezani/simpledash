"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { deleteAccount, disconnectGoogle, publicSlugOf } from "@/lib/account/account";
import { endCurrentSession, requireUser } from "@/lib/auth/session";
import { publicTag } from "@/lib/public-page/view";

/** Settings → "Disconnect Google": revoke, clear tokens, sign out. Everything else is kept. */
export async function disconnectGoogleAction() {
  const user = await requireUser();
  const slug = await publicSlugOf(user.id);
  await endCurrentSession();
  await disconnectGoogle(user.id);
  if (slug) updateTag(publicTag(slug)); // the public page pauses
  redirect("/signin?disconnected=1");
}

/** Settings → "Delete account", confirmed by typing DELETE. */
export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  if (formData.get("confirm") !== "DELETE") redirect("/settings?delete=confirm#delete");
  const slug = await publicSlugOf(user.id);
  const result = await deleteAccount(user.id);
  if ("error" in result) redirect("/settings?delete=error#delete");
  if (slug) updateTag(publicTag(slug)); // the public page is gone
  await endCurrentSession();
  redirect("/account-deleted");
}
