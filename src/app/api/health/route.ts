import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db/client";

const noStore = { "Cache-Control": "no-store" };

/** Health check with a database ping (docs/SPEC.md section 20). Returns 200 or 503. */
export async function GET() {
  await connection();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), 5000);
      }),
    ]);
    return Response.json({ status: "ok" }, { headers: noStore });
  } catch {
    return Response.json({ status: "error" }, { status: 503, headers: noStore });
  } finally {
    clearTimeout(timer);
  }
}
