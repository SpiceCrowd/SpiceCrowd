import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { verifyToken } from "@/lib/auth";

type StoredUser = { id: string; email: string; name?: string; phone?: string; countryCode?: string; password?: string; role?: string };

function getIdentity(req: Request) {
  const payload = verifyToken(req.headers.get("authorization"));
  return payload?.sub || payload?.email ? payload : null;
}

function publicUser(user: StoredUser) {
  return { id: user.id, email: user.email, name: user.name, phone: user.phone, countryCode: user.countryCode, role: user.role || "user" };
}

export async function GET(req: Request) {
  const identity = getIdentity(req);
  if (!identity) return NextResponse.json({ success: false, error: "authentication required" }, { status: 401 });
  const users = await readJson<StoredUser[]>("users.json", []);
  const user = users.find((candidate) => candidate.id === identity.sub || candidate.email === identity.email);
  if (!user) return NextResponse.json({ success: false, error: "user not found" }, { status: 404 });
  return NextResponse.json({ success: true, user: publicUser(user) });
}

export async function PUT(req: Request) {
  const identity = getIdentity(req);
  if (!identity) return NextResponse.json({ success: false, error: "authentication required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";
  const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim().slice(0, 8) : "";
  if (!name || !phone || !countryCode) return NextResponse.json({ success: false, error: "name, phone and country code are required" }, { status: 400 });
  const users = await readJson<StoredUser[]>("users.json", []);
  const index = users.findIndex((candidate) => candidate.id === identity.sub || candidate.email === identity.email);
  if (index < 0) return NextResponse.json({ success: false, error: "user not found" }, { status: 404 });
  users[index] = { ...users[index], name, phone, countryCode };
  await writeJson("users.json", users);
  return NextResponse.json({ success: true, user: publicUser(users[index]) });
}
