import { NextResponse } from "next/server";
import { updateJson } from "@/lib/storage";
import { isValidEmail } from "@/lib/notifications";

type Subscriber = { email: string; subscribedAt: string };

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  if (!isValidEmail(email)) return NextResponse.json({ success: false, error: "Enter a valid email address" }, { status: 400 });

  await updateJson<Subscriber[]>("newsletter.json", [], (subscribers) => {
    const list = Array.isArray(subscribers) ? subscribers : [];
    return list.some((entry) => entry.email === email) ? list : [...list, { email, subscribedAt: new Date().toISOString() }];
  });
  return NextResponse.json({ success: true });
}
