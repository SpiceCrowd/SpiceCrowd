import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

export default function OrderConfirmation() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/16 p-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Thank you - Order Confirmed!</h1>
          <p className="mt-4 text-base text-slate-700">Your order has been placed. We will email you the confirmation and tracking details.</p>
          <Link href="/account/orders" className="brand-btn mt-6 px-6 py-2.5">
            View My Orders
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
