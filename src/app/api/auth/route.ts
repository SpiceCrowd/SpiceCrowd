import { NextResponse } from "next/server";
import { readJson, updateJson } from "@/lib/storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getJwtSecret, isAdmin } from "@/lib/auth";
import { notifyEmail } from "@/lib/notifications";

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = await import("@/lib/db");
    return db.prisma;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body.action || "login"; // "login" | "register"
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body?.password;
  if (!email) return NextResponse.json({ success: false, error: "email required" }, { status: 400 });

  if (action === "admin-login") {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) return NextResponse.json({ success: false, error: "admin credentials are not configured" }, { status: 503 });
    if (email !== adminEmail || password !== adminPassword) return NextResponse.json({ success: false, error: "invalid admin credentials" }, { status: 401 });
    const token = jwt.sign({ sub: "admin", email: adminEmail, role: "admin", isAdmin: true }, getJwtSecret(), { expiresIn: "8h" });
    return NextResponse.json({ success: true, token, user: { id: "admin", email: adminEmail, name: "Admin", role: "admin", isAdmin: true } });
  }

  const prisma = await getPrisma();

  if (action === "register") {
    const hash = password ? await bcrypt.hash(password, 10) : undefined;
    if (prisma) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return NextResponse.json({ success: false, error: "user exists" }, { status: 409 });
      let u;
      try {
        u = await prisma.user.create({ data: { email, name: body?.name, role: 'user' } });
      } catch (error: any) {
        if (error?.code === "P2002") return NextResponse.json({ success: false, error: "user exists" }, { status: 409 });
        throw error;
      }
      await updateJson<any[]>("users.json", [], (users) => [...users, { id: u.id, email, password: hash, phone: body?.phone, countryCode: body?.countryCode, name: body?.name }]);
      const token = jwt.sign({ sub: u.id, email: u.email }, getJwtSecret(), { expiresIn: "7d" });
      await notifyEmail({ to: email, subject: "Welcome to Spice Crowd", text: `Welcome ${u.name || "to Spice Crowd"}. Your account is ready.`, key: `welcome:${u.id}` });
      return NextResponse.json({ success: true, token, user: { id: u.id, email: u.email, name: u.name, phone: body?.phone, countryCode: body?.countryCode } });
    }

    // File-based fallback
    let user: any;
    try {
      user = await updateJson<any[]>("users.json", [], (users) => {
        if (users.find((x) => x.email === email)) return users;
        user = { id: `user_${Date.now()}-${Math.random().toString(36).slice(2)}`, email, password: hash, phone: body?.phone, countryCode: body?.countryCode, name: body?.name };
        return [...users, user];
      }).then(() => user);
    } catch (error) {
      throw error;
    }
    if (!user) return NextResponse.json({ success: false, error: "user exists" }, { status: 409 });
    const token = jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), { expiresIn: "7d" });
    await notifyEmail({ to: email, subject: "Welcome to Spice Crowd", text: `Welcome ${user.name || "to Spice Crowd"}. Your account is ready.`, key: `welcome:${user.id}` });
    return NextResponse.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, countryCode: user.countryCode } });
  }

  // login
  if (prisma) {
    // try file-backed passwords first
    const users = await readJson<any[]>("users.json", []);
    const local = users.find((u) => u.email === email);
    if (local && local.password) {
      const ok = await bcrypt.compare(password || "", local.password);
      if (!ok) return NextResponse.json({ success: false, error: "invalid credentials" }, { status: 401 });
      const token = jwt.sign({ sub: local.id, email: local.email }, getJwtSecret(), { expiresIn: "7d" });
      return NextResponse.json({ success: true, token, user: { id: local.id, email: local.email, name: local.name, phone: local.phone, countryCode: local.countryCode } });
    }
    // Existing users only; never create accounts during login.
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) return NextResponse.json({ success: false, error: "invalid credentials" }, { status: 401 });
    const token = jwt.sign({ sub: u.id, email: u.email }, getJwtSecret(), { expiresIn: "7d" });
    return NextResponse.json({ success: true, token, user: { id: u.id, email: u.email, name: u.name } });
  }

  // File-based login (dev)
  const users = await readJson<any[]>("users.json", []);
  const user = users.find((u) => u.email === email);
  if (!user) return NextResponse.json({ success: false, error: "invalid credentials" }, { status: 401 });

  const token = jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), { expiresIn: "7d" });
  return NextResponse.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, countryCode: user.countryCode } });
}

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get("authorization") || req.headers.get("Authorization"))) {
    return NextResponse.json({ success: false, error: "admin required" }, { status: 403 });
  }
  const prisma = await getPrisma();
  if (prisma) {
    const users = await prisma.user.findMany();
    return NextResponse.json({ success: true, users });
  }
  const users = await readJson<{ id: string; email: string }[]>("users.json", []);
  return NextResponse.json({ success: true, users });
}
