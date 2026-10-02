"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

export default function AccountPage() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [countryCode, setCountryCode] = useState(user?.countryCode || "+91");
  const [message, setMessage] = useState("");

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    const ok = await updateProfile({ name, phone, countryCode });
    setMessage(ok ? "Profile updated successfully." : "Unable to update profile.");
    if (ok) setEditing(false);
  };

  return (
    <>
      <Header />
      <main className="brand-page-bg mx-auto max-w-4xl p-8">
        <h1 className="text-2xl font-bold">My Account</h1>
        <div className="mt-6 space-y-4">
          {user ? (
            <div className="space-y-2">
              <div>Signed in as <strong>{user?.email || 'user'}</strong></div>
              {user?.name && <div className="text-sm text-slate-600">Name: <strong>{user.name}</strong></div>}
              {user?.phone && (
                <div className="text-sm text-slate-600">
                  Phone: <strong>{`${user.countryCode || ''} ${user.phone}`.trim()}</strong>
                </div>
              )}
              <div className="flex gap-3">
                <Link className="brand-btn-outline" href="/account/orders">My Orders</Link>
                <Link className="brand-btn-outline" href="/account/addresses">Addresses</Link>
                <button className="brand-btn" onClick={logout}>Logout</button>
                <button className="brand-btn-outline" onClick={() => setEditing((open) => !open)}>{editing ? "Cancel" : "Edit profile"}</button>
              </div>
              {editing && <form onSubmit={saveProfile} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="form-input" />
                <div className="flex gap-2"><select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="form-input w-28"><option>+91</option><option>+1</option><option>+44</option></select><input required value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Phone number" className="form-input" /></div>
                <button type="submit" className="brand-btn">Save profile</button>
              </form>}
              {message && <p className="text-sm text-[color:var(--brand-deep-green)]">{message}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Link className="brand-btn" href="/account/login">Login</Link>
              <Link className="brand-btn-outline" href="/account/register">Register</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
