import { readJson, writeJson } from "@/lib/storage";

export type NotificationInput = {
  to: string;
  subject: string;
  text: string;
  key: string;
};

type NotificationLog = NotificationInput & {
  provider: "local" | "sendgrid";
  createdAt: string;
};

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function notifyEmail(input: NotificationInput) {
  const to = input.to.trim().toLowerCase();
  const subject = input.subject.trim().slice(0, 180);
  const text = input.text.trim().slice(0, 10000);
  const key = input.key.trim().slice(0, 240);
  if (!isValidEmail(to) || !subject || !text || !key) return { sent: false, reason: "invalid notification" };

  const log = await readJson<NotificationLog[]>("email-log.json", []);
  if (log.some((entry) => entry.key === key)) return { sent: false, duplicate: true };

  const localMode = process.env.NODE_ENV !== "production";
  const providerKey = process.env.EMAIL_PROVIDER_API_KEY || process.env.SENDGRID_API_KEY;
  if (localMode) {
    log.push({ to, subject, text, key, provider: "local", createdAt: new Date().toISOString() });
    await writeJson("email-log.json", log);
    return { sent: true, provider: "local" as const };
  }

  if (!providerKey || !process.env.FROM_EMAIL || !isValidEmail(process.env.FROM_EMAIL)) {
    return { sent: false, reason: "email provider is not configured" };
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${providerKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.FROM_EMAIL },
        subject,
        content: [{ type: "text/plain", value: text }],
      }),
    });
    if (!response.ok) return { sent: false, reason: "email provider rejected the message" };
    log.push({ to, subject, text: "[sent]", key, provider: "sendgrid", createdAt: new Date().toISOString() });
    await writeJson("email-log.json", log);
    return { sent: true, provider: "sendgrid" as const };
  } catch {
    return { sent: false, reason: "email provider unavailable" };
  }
}