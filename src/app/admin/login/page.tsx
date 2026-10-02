"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admin-login", email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.token) {
        setError(data.error || "Unable to sign in as admin");
        return;
      }
      localStorage.setItem("sc_token", data.token);
      localStorage.setItem("sc_user", JSON.stringify({ ...data.user, token: data.token }));
      router.replace(searchParams.get("next") || "/admin");
    } catch {
      setError("Unable to connect to the admin login service");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="form-shell w-full max-w-md p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-deep-green)]">Restricted access</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use the admin credentials configured for this environment.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" className="form-input" />
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" className="form-input" />
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={loading} type="submit" className="brand-btn w-full justify-center disabled:cursor-wait disabled:opacity-60">{loading ? "Signing in..." : "Sign in to admin"}</button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50" />}><AdminLoginContent /></Suspense>;
}
