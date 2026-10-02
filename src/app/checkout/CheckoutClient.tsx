"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatCurrency } from "@/lib/cart";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastProvider";
import { userFacingError } from "@/lib/userFacingError";

type CheckoutAddress = Record<string, FormDataEntryValue>;

type OrderCreateResponse = {
  success?: boolean;
  error?: string;
  orderId?: string;
  order?: {
    total: number;
  };
};

type PaymentResponse = {
  success?: boolean;
  provider?: string;
};

export default function CheckoutClient() {
  const { items, total, clearCart } = useCart();
  const { show } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay-card");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiHandle, setUpiHandle] = useState("");
  const [bankName, setBankName] = useState("hdfc");
  const [walletName, setWalletName] = useState("paytm");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);
    const address: CheckoutAddress = {};
    for (const [k, v] of form.entries()) address[k] = v;

    try {
      const paymentDetails =
        paymentMethod === "razorpay-card"
          ? { cardHolder, cardNumber, cardExpiry, cardCvv }
          : paymentMethod === "razorpay-upi"
            ? { upiHandle, qrMode: true }
            : paymentMethod === "razorpay-netbanking"
              ? { bankName }
              : paymentMethod === "razorpay-wallet"
                ? { walletName }
                    : {};
      // Create order
      const orderRes = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, total, address, coupon: address.coupon, payment: { method: paymentMethod, success: true, provider: 'dummy' }, demoPayment: true }) });
      const orderData = (await orderRes.json()) as OrderCreateResponse;
      if (!orderData?.success) {
        setSubmitError(orderData.error || 'Order creation failed. Please review your cart and try again.');
        return;
      }

      const orderId = orderData.orderId;

      // Create payment
      const payRes = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: orderData.order?.total ?? total, currency: 'INR', orderId, method: paymentMethod, details: paymentDetails }) });
      const payData = (await payRes.json()) as PaymentResponse;
      if (!payData?.success) {
        setSubmitError('Payment initialization failed. Please try again.');
        return;
      }

      if (payData.provider === 'mock') {
        // simulate webhook for dev
        await fetch('/api/payments/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'payment.captured', orderId }) });
      }

      // Optionally update order status endpoint is triggered by webhook; fetch latest
      await fetch('/api/orders');
      show(`Order ${orderId} placed successfully.`, "success");
      // Clear cart after placing order
      try { clearCart(); } catch {}
    } catch (error) {
      setSubmitError(userFacingError(error, "We couldn't complete your order. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-[color:var(--brand-deep-green)]">Checkout</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">Complete your order</h1>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-[color:var(--brand-gold)] hover:bg-slate-50"
        >
          Continue shopping
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_0.85fr]">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] bg-white p-8 shadow-sm shadow-slate-200/40">
          <div className="rounded-[2rem] border border-slate-200 p-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Step 2</p>
              <h2 className="text-2xl font-semibold text-slate-900">Delivery Address</h2>
              <p className="mt-2 text-sm text-slate-600"><span aria-hidden="true" className="font-bold text-[color:var(--brand-maroon)]">*</span> Required fields. GSTIN is optional.</p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { name: "name", label: "Full name", type: "text", placeholder: "Enter your full name" },
                { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
                { name: "phone", label: "Phone", type: "tel", placeholder: "+91 98765 43210" },
                { name: "pincode", label: "Pincode", type: "text", placeholder: "637411" },
                { name: "address", label: "Address line 1", type: "text", placeholder: "House / Flat No, Street", full: true },
                { name: "city", label: "City", type: "text", placeholder: "Chennai" },
                { name: "state", label: "State", type: "text", placeholder: "Tamil Nadu" },
                { name: "gstin", label: "GSTIN (optional)", type: "text", placeholder: "22AAAAA0000A1Z5", full: true },
              ].map((field) => (
                <label key={field.name} className={`block space-y-2 text-sm text-slate-700 ${field.full ? "sm:col-span-2" : ""}`}>
                  <span className="font-semibold">{field.label}{field.name !== "gstin" && <span aria-hidden="true" className="ml-1 text-[color:var(--brand-maroon)]">*</span>}</span>
                  <input
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.name !== "gstin"}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/35"
                  />
                </label>
              ))}
            </div>
            <label className="block space-y-2 text-sm text-slate-700">
              <span className="font-semibold">Special instructions</span>
              <textarea
                name="notes"
                placeholder="Leave a note for the delivery team"
                rows={4}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/35"
              />
            </label>
          </div>

          <div className="rounded-[2rem] border border-slate-200 p-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Step 3</p>
              <h2 className="text-2xl font-semibold text-slate-900">Payment Method</h2>
            </div>
            <div className="mt-6 grid gap-3">
              {[
                { id: "razorpay-card", label: "Card (Visa, Mastercard, Rupay, Amex)" },
                { id: "razorpay-upi", label: "UPI (GPay, PhonePe, Paytm, BHIM)" },
                { id: "razorpay-netbanking", label: "Netbanking" },
                { id: "razorpay-wallet", label: "Wallets" },
              ].map((method) => (
                <label key={method.id} className="flex cursor-pointer items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-[color:var(--brand-gold)]">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                    required
                    className="h-5 w-5 accent-[color:var(--brand-deep-green)]"
                  />
                  <span className="text-sm font-semibold text-slate-900">{method.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{paymentMethod === "razorpay-upi" ? "UPI / QR" : paymentMethod === "razorpay-netbanking" ? "Netbanking" : paymentMethod === "razorpay-wallet" ? "Wallets" : paymentMethod === "razorpay-emi" ? "EMI / Pay Later" : "Card"} details</p>
              {paymentMethod === "razorpay-card" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Card holder name" className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/35" />
                  <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/35" />
                  <input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/35" />
                  <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/35" />
                </div>
              )}
              {paymentMethod === "razorpay-upi" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                  <input value={upiHandle} onChange={(e) => setUpiHandle(e.target.value)} placeholder="name@upi" className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/35" />
                  <div className="rounded-3xl border border-dashed border-[color:var(--brand-gold)]/55 bg-white p-4 text-center text-sm text-slate-600">QR code placeholder</div>
                </div>
              )}
              {paymentMethod === "razorpay-netbanking" && (
                <div className="mt-4">
                  <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/35">
                    <option value="hdfc">HDFC Bank</option>
                    <option value="sbi">State Bank of India</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                    <option value="kotak">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}
              {paymentMethod === "razorpay-wallet" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { id: "paytm", label: "Paytm" },
                    { id: "phonepe", label: "PhonePe" },
                    { id: "mobikwik", label: "MobiKwik" },
                    { id: "amazonpay", label: "Amazon Pay" },
                  ].map((wallet) => (
                    <label key={wallet.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 ${walletName === wallet.id ? "border-[color:var(--brand-gold)]/40 bg-[color:var(--brand-gold)]/10" : "border-slate-200 bg-white"}`}>
                      <input type="radio" name="walletName" checked={walletName === wallet.id} onChange={() => setWalletName(wallet.id)} className="h-4 w-4 accent-[color:var(--brand-deep-green)]" />
                      <span className="text-sm font-semibold text-slate-900">{wallet.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 p-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Order details</p>
              <h2 className="text-2xl font-semibold text-slate-900">Apply a coupon</h2>
            </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                name="coupon"
                placeholder="SPICE10 / FIRST20"
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/35"
              />
              <button type="button" className="brand-btn px-6 py-3">
                Apply
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Required fields must be filled before submission.</p>
              {submitError && (
                <p className="mt-2 text-sm font-medium text-[color:var(--brand-deep-green)]" role="alert">
                  {submitError}
                </p>
              )}
            </div>
            <button disabled={isSubmitting} type="submit" className="brand-btn inline-flex w-full justify-center px-8 py-4 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm shadow-slate-200/40">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Order summary</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">Your cart</h2>
            <div className="mt-8 space-y-4">
              {items.length === 0 ? (
                <div className="rounded-[1.5rem] bg-white p-5 shadow-sm shadow-slate-200/40">
                  <p className="text-sm text-slate-600">Your cart is empty.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.slug} className="rounded-[1.5rem] bg-white p-5 shadow-sm shadow-slate-200/40">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-600">{item.priceLabel}</p>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <span>Quantity</span>
                      <span>{item.quantity}</span>
                    </div>
                  </div>
                ))
              )}
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                  <span>Delivery</span>
                  <span>₹50</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(total + 50)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Need help?</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">We can arrange special delivery instructions, gift wrap, or GST invoice requests. Fill in your details above and place your order safely.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
