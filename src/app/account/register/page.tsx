"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

const countryCodes = ["+91", "+1", "+44", "+61", "+971"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;

type FieldErrors = {
  phone?: string;
  email?: string;
};

export default function RegisterPage() {
  const { registerWithMethod } = useAuth();
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const router = useRouter();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const nextErrors: FieldErrors = {};
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedPhone) {
      nextErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(trimmedPhone)) {
      nextErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required";
    } else if (!emailRegex.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError(null);
      return;
    }

    const ok = await registerWithMethod({ mode: "email", name, email: trimmedEmail, phone: trimmedPhone, countryCode });

    if (ok) router.push('/account');
    else setError('Enter valid details to create account');
  };

  return (
    <>
      <Header />
      <main className="brand-page-bg mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
        <div className="form-shell p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-deep-green)]">New account</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Create account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Create an account to keep your orders, addresses, and preferences together.</p>

        <form className="mt-8 space-y-4" onSubmit={submit}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="form-input" />

          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="brand-focus w-28 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 transition focus:bg-white"
              required
            >
              {countryCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              value={phone}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhone(cleaned);
                setFieldErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              placeholder="Phone number"
              inputMode="numeric"
              className={`form-input ${fieldErrors.phone ? "form-input-error" : ""}`}
              required
            />
          </div>
          {fieldErrors.phone && <p className="-mt-2 text-xs font-medium text-[color:var(--brand-deep-green)]">{fieldErrors.phone}</p>}

          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="Email or Outlook"
            className={`form-input ${fieldErrors.email ? "form-input-error" : ""}`}
            required
          />
          {fieldErrors.email && <p className="-mt-2 text-xs font-medium text-[color:var(--brand-deep-green)]">{fieldErrors.email}</p>}

          {error && <div className="brand-alert rounded-2xl border px-4 py-3 text-sm font-medium">{error}</div>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="brand-btn" type="submit">Create</button>
            <a className="brand-btn-outline" href="/account/login">Already have an account?</a>
          </div>
        </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
