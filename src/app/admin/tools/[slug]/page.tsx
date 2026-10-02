import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminOptionBySlug } from "@/lib/adminOptions";

export default async function AdminToolWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolved = params instanceof Promise ? await params : params;
  const option = getAdminOptionBySlug(resolved.slug);

  if (!option) {
    notFound();
  }

  // Keep old tool URLs synchronized with new live module routes.
  if (option.status === "live") {
    redirect(option.href);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-deep-green)]">Admin Workspace</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{option.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{option.description}</p>

        <div className="mt-6 rounded-2xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/15 p-4 text-sm text-[color:var(--brand-deep-green)]">
          This module route is active and ready for implementation. Use it as the working screen while we build full CRUD and analytics flows.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin" className="rounded-full bg-[color:var(--brand-deep-green)] px-5 py-2.5 text-sm font-semibold text-[color:var(--brand-gold)] transition hover:bg-[color:var(--brand-maroon-700)]">
            Back to Admin Panel
          </Link>
          <Link href="/admin/products" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--brand-gold)] hover:text-[color:var(--brand-deep-green)]">
            Open Products
          </Link>
          <Link href="/admin/orders" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--brand-gold)] hover:text-[color:var(--brand-deep-green)]">
            Open Orders
          </Link>
        </div>
      </div>
    </main>
  );
}
