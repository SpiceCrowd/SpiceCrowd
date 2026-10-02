"use client";

import { useEffect } from "react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Unhandled application error", { digest: undefined }); }, []);
  return <main className="brand-page-bg flex min-h-screen items-center justify-center px-6 py-16 text-center"><div className="max-w-lg rounded-2xl border border-[color:var(--brand-line)] bg-white p-8 shadow-xl sm:p-12"><p className="eyebrow">Spice Crowd</p><h1 className="mt-3 text-4xl text-slate-950">Something went wrong.</h1><p className="mt-4 leading-7 text-slate-600">We couldn&apos;t load this page. Your saved cart and account details are safe. Please try again.</p><button type="button" onClick={() => reset()} className="brand-btn mt-7">Try again</button></div></main>;
}
