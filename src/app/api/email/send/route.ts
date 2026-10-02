import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAdmin } from "@/lib/auth";
import { isValidEmail, notifyEmail } from "@/lib/notifications";

export async function POST(req: Request) {
  if (!isAdmin(req.headers.get("authorization") || req.headers.get("Authorization"))) {
    return NextResponse.json({ success: false, error: "admin required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!isValidEmail(to) || !subject || !text) {
    return NextResponse.json({ success: false, error: "valid recipient, subject and body are required" }, { status: 400 });
  }
  const result = await notifyEmail({ to, subject, text, key: typeof body.key === "string" ? body.key : `manual:${randomUUID()}` });
  if (!result.sent && !result.duplicate) return NextResponse.json({ success: false, error: "notification could not be delivered" }, { status: 502 });
  return NextResponse.json({ success: true, provider: result.provider || "deduplicated" });
}
