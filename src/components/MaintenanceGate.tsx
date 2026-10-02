"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const maintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const isAdminPath = pathname?.startsWith("/admin");
  if (!maintenance || isAdminPath) return children;
  return <main className="brand-page-bg flex min-h-screen items-center justify-center px-6 py-16 text-center"><div className="max-w-lg rounded-2xl border border-[color:var(--brand-line)] bg-white p-8 shadow-xl sm:p-12"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[color:var(--brand-deep-green)] text-2xl text-[color:var(--brand-gold)]">✦</div><p className="eyebrow mt-6">Spice Crowd</p><h1 className="mt-3 text-4xl text-slate-950">We&apos;re making Spice Crowd even better.</h1><p className="mt-4 leading-7 text-slate-600">Our website is currently undergoing scheduled maintenance. Please check back shortly.</p><button type="button" onClick={() => window.location.reload()} className="brand-btn mt-7">Try again</button></div></main>;
}
