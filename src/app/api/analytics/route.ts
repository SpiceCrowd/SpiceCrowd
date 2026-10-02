import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const events = await readJson<any[]>("analytics.json", []);
  const entry = { id: `evt_${Date.now()}`, event: body.event || "pageview", props: body.props || {}, ts: new Date().toISOString() };
  events.push(entry);
  await writeJson("analytics.json", events);
  return NextResponse.json({ success: true, entry });
}
