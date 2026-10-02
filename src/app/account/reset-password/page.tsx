"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
  const [token] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", token, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || "Unable to reset password");
      return;
    }
    setMessage("Password reset successfully. You can now sign in.");
    setPassword("");
  }

  return (
    <main className="brand-page-bg mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <div className="form-shell p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-deep-green)]">Account access</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Reset password</h1>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-700">
            New password
            <input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="form-input mt-2" />
          </label>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
          <button type="submit" className="brand-btn">Reset password</button>
        </form>
      </div>
    </main>
  );
}
