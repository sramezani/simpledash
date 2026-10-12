import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { lazyObject } from "@/lib/lazy";

const createResend = () => new Resend(env.RESEND_API_KEY);
const resend: ReturnType<typeof createResend> = lazyObject(createResend);

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** One-click unsubscribe URL (List-Unsubscribe, as Gmail and Yahoo require). */
  unsubscribeUrl: string;
};

/** Sends up to 100 emails in one Resend batch call. Returns the message IDs, in order. */
export async function sendBatch(emails: OutgoingEmail[]): Promise<string[]> {
  if (emails.length === 0) return [];
  if (emails.length > 100) throw new Error("A Resend batch holds at most 100 emails");
  const { data, error } = await resend.batch.send(
    emails.map((e) => ({
      from: env.EMAIL_FROM,
      to: e.to,
      subject: e.subject,
      html: e.html,
      text: e.text,
      headers: {
        "List-Unsubscribe": `<${e.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    })),
  );
  if (error) throw new Error(`Resend: ${error.message}`);
  return (data?.data ?? []).map((d) => d.id);
}
