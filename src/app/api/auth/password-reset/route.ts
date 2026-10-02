import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { isValidEmail, notifyEmail } from "@/lib/notifications";

type ResetToken = { token: string; userId: string; email: string; expiresAt: string; usedAt?: string };

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body?.action === "reset" ? "reset" : "request";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const generic = { success: true, message: "If an account exists, a password reset email has been sent." };

  if (action === "request") {
    if (!isValidEmail(email)) return NextResponse.json(generic);
    const users = await readJson<any[]>("users.json", []);
    const user = users.find((candidate) => candidate.email === email);
    if (!user) return NextResponse.json(generic);
    const token = randomBytes(32).toString("hex");
    const tokens = await readJson<ResetToken[]>("password-reset-tokens.json", []);
    tokens.push({ token, userId: user.id, email, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() });
    await writeJson("password-reset-tokens.json", tokens);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await notifyEmail({ to: email, subject: "Reset your Spice Crowd password", text: `Reset your password using this link: ${appUrl}/account/reset-password?token=${token}`, key: `password-reset:${token}` });
    return NextResponse.json(generic);
  }

  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!token || password.length < 8) return NextResponse.json({ success: false, error: "token and password of at least 8 characters are required" }, { status: 400 });
  const tokens = await readJson<ResetToken[]>("password-reset-tokens.json", []);
  const reset = tokens.find((candidate) => candidate.token === token && !candidate.usedAt && new Date(candidate.expiresAt).getTime() > Date.now());
  if (!reset) return NextResponse.json({ success: false, error: "invalid or expired reset token" }, { status: 400 });
  const users = await readJson<any[]>("users.json", []);
  const index = users.findIndex((user) => user.id === reset.userId && user.email === reset.email);
  if (index < 0) return NextResponse.json({ success: false, error: "invalid or expired reset token" }, { status: 400 });
  users[index] = { ...users[index], password: await bcrypt.hash(password, 10) };
  await writeJson("users.json", users);
  await writeJson("password-reset-tokens.json", tokens.map((candidate) => candidate.token === token ? { ...candidate, usedAt: new Date().toISOString() } : candidate));
  return NextResponse.json({ success: true });
}