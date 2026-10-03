"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import { useCart } from "@/components/cart/CartProvider";
import CartSummary from "@/components/cart/CartSummary";
import { calculateCartTotals, couponStorageKey } from "@/lib/cart";
import { calculateOrderTotal } from "@/lib/orderUtils";

type PaymentResponse = {
  paymentId?: string;
  success?: boolean;
  error?: string;
};

type OrderResponse = {
  success?: boolean;
  error?: string;
  order?: {
    id?: string;
    [key: string]: unknown;
  };
  orderId?: string;
};

type ProductStockResponse = {
  success?: boolean;
  product?: {
    slug: string;
    stock?: number;
    title?: string;
  } | null;
};

type StockIssue = {
  available: number;
  requested: number;
  slug: string;
  title: string;
};

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const productionCheckoutDisabled = process.env.NODE_ENV === "production";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [shipping, setShipping] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("razorpay-card");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiHandle, setUpiHandle] = useState("");
  const [bankName, setBankName] = useState("hdfc");
  const [walletName, setWalletName] = useState("paytm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);
  const [couponCode, setCouponCode] = useState("");

  const shippingCost = shipping === "express" ? 150 : 50;
  const totals = calculateCartTotals(items, shippingCost);
  const payable = calculateOrderTotal(totals.subtotal, couponCode, null, shippingCost).total;
  const hasBlockingStock = stockIssues.length > 0;
  const isCartEmpty = items.length === 0;
  const stepPillClass = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]";

  const inputClass =
    "brand-focus w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:bg-white";
  const selectedPaymentLabel = {
    "razorpay-card": "Card",
    "razorpay-upi": "UPI / QR",
    "razorpay-netbanking": "Netbanking",
    "razorpay-wallet": "Wallets",
  }[paymentMethod] || "Card";

  useEffect(() => {
    const timer = window.setTimeout(() => setCouponCode(window.localStorage.getItem(couponStorageKey) || ""), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkStock = async () => {
      if (!items.length) {
        setStockIssues([]);
        return;
      }

      try {
        const results = await Promise.all(
          items.map(async (item) => {
            const res = await fetch(`/api/products?slug=${encodeURIComponent(item.slug)}`);
            const json = (await res.json().catch(() => ({}))) as ProductStockResponse;
            return {
              slug: item.slug,
              title: item.title,
              wantedQty: item.quantity,
              stock: json.product?.stock,
            };
          }),
        );

        const unavailable = results
          .map((result) => ({
            ...result,
            normalizedStock: typeof result.stock === "number" ? result.stock : 0,
          }))
          .filter((result) => result.normalizedStock < result.wantedQty)
          .map((result) => ({
            slug: result.slug,
            title: result.title,
            requested: result.wantedQty,
            available: result.normalizedStock,
          }));

        if (!cancelled) {
          setStockIssues(unavailable);
        }
      } catch {
        if (!cancelled) {
          setStockIssues([]);
        }
      }
    };

    void checkStock();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const handlePay = async (demoLineItems?: typeof items) => {
    if (productionCheckoutDisabled) {
      setError("Live checkout is unavailable. No payment or order was processed.");
      return;
    }
    setError(null);
    const checkoutItems = demoLineItems && demoLineItems.length > 0 ? demoLineItems : items;
    const checkoutTotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const checkoutPayable = calculateOrderTotal(checkoutTotal, couponCode, null, shippingCost).total;

    if (checkoutItems.length === 0) {
      setError("Your cart is empty. Add items before checkout.");
      return;
    }
    if (stockIssues.length > 0) {
      setError("Please reduce quantities before payment.");
      return;
    }
    if (!name || !phone || !address) {
      setError("Please fill name, phone and address");
      return;
    }
    if (!/^\d{6}$/.test(postal)) {
      setError("Enter a valid 6-digit Indian PIN code");
      return;
    }

    setLoading(true);
    try {
      // create payment (mock)
      const token = typeof window !== 'undefined' ? localStorage.getItem('sc_token') : null;
      const payHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) payHeaders['authorization'] = `Bearer ${token}`;
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
      const payRes = await fetch('/api/payments', {
        method: 'POST',
        headers: payHeaders,
        body: JSON.stringify({ amount: checkoutPayable, method: paymentMethod, currency: 'INR', details: paymentDetails }),
      });
      const payJson = (await payRes.json().catch(() => ({}))) as PaymentResponse;
      if (!payJson?.paymentId && !payJson?.success) {
        throw new Error(payJson.error || 'payment failed');
      }

      // create order
      const orderHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) orderHeaders['authorization'] = `Bearer ${token}`;
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: orderHeaders,
        body: JSON.stringify({
          customer: { name, phone, address, city, postal },
          items: checkoutItems,
          payment: { ...payJson, method: paymentMethod, details: paymentDetails },
          shipping: { method: shipping, cost: shippingCost },
          coupon: couponCode || undefined,
          demoPayment: true,
          total: checkoutPayable,
        }),
      });

      const orderJson = (await orderRes.json().catch(() => ({}))) as OrderResponse;
      if (!orderJson?.success) {
        throw new Error(orderJson.error || 'order creation failed');
      }

      const oid = orderJson?.order?.id || orderJson?.orderId;
      if (!oid) throw new Error('order creation failed');

      if (typeof window !== "undefined") {
        const lastOrderPayload = {
          ...(orderJson?.order || {}),
          id: oid,
          items: demoLineItems && demoLineItems.length > 0 ? demoLineItems : items,
          total: checkoutPayable,
          status: (orderJson?.order as { status?: string } | undefined)?.status || "paid",
          fulfillmentStatus: (orderJson?.order as { fulfillmentStatus?: string } | undefined)?.fulfillmentStatus || "processing",
          createdAt: (orderJson?.order as { createdAt?: string } | undefined)?.createdAt || new Date().toISOString(),
          customer: { name, phone, address, city, postal },
          payment: { method: paymentMethod, provider: "dummy", details: paymentDetails },
          shipping: { method: shipping, cost: shippingCost },
        };
        window.localStorage.setItem("sc_last_order", JSON.stringify(lastOrderPayload));
      }

      clearCart();
      router.push(`/account/track/${oid}?view=invoice`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="brand-page-bg py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-[color:var(--brand-gold)]/35 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.35fr_0.75fr] lg:items-center">
              <div>
                <span className={`${stepPillClass} brand-pill`}>Secure checkout</span>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Checkout</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Confirm your delivery details, review stock status, and finish your order in one clean flow.
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Step 1</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">Delivery details</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Step 2</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">Shipping choice</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Step 3</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">Payment review</p>
                </div>
              </div>
            </div>
          </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="checkout-card p-5 shadow-sm shadow-slate-200/50 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Delivery details</h2>
                  <p className="mt-1 text-sm text-slate-500">Use the address where you want the spices delivered.</p>
                  <p className="mt-2 text-xs text-slate-500"><span aria-hidden="true" className="font-bold text-[color:var(--brand-maroon)]">*</span> Required fields. Payment details are used only for this checkout.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Required</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">Full name <span aria-hidden="true" className="text-[color:var(--brand-maroon)]">*</span><input aria-label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputClass} required /></label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">Phone <span aria-hidden="true" className="text-[color:var(--brand-maroon)]">*</span><input aria-label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputClass} required /></label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">City <span aria-hidden="true" className="text-[color:var(--brand-maroon)]">*</span><input aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputClass} required /></label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">Postal code <span aria-hidden="true" className="text-[color:var(--brand-maroon)]">*</span><input aria-label="Postal code" value={postal} onChange={(e) => setPostal(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Postal code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" className={inputClass} required /></label>
                <label className="space-y-2 text-sm font-semibold text-slate-700 sm:col-span-2">Address <span aria-hidden="true" className="text-[color:var(--brand-maroon)]">*</span><textarea aria-label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className={`${inputClass} min-h-[120px]`} required /></label>
              </div>
            </div>

            <div className="checkout-card p-5 shadow-sm shadow-slate-200/50 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-950">Shipping</h2>
              <p className="mt-1 text-sm text-slate-500">Choose the delivery speed that matches your order urgency.</p>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <label className={`cursor-pointer rounded-2xl border p-3.5 transition ${shipping === 'standard' ? 'border-[color:var(--brand-maroon)]/35 bg-[color:var(--brand-maroon)]/10 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="shipping" checked={shipping === 'standard'} onChange={() => setShipping('standard')} className="mt-1 h-4 w-4 accent-[color:var(--brand-maroon)]" />
                    <div>
                      <p className="font-semibold text-slate-950">Standard</p>
                      <p className="mt-1 text-sm text-slate-600">₹50 · 3-5 days</p>
                    </div>
                  </div>
                </label>
                <label className={`cursor-pointer rounded-2xl border p-3.5 transition ${shipping === 'express' ? 'border-[color:var(--brand-maroon)]/35 bg-[color:var(--brand-maroon)]/10 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="shipping" checked={shipping === 'express'} onChange={() => setShipping('express')} className="mt-1 h-4 w-4 accent-[color:var(--brand-maroon)]" />
                    <div>
                      <p className="font-semibold text-slate-950">Express</p>
                      <p className="mt-1 text-sm text-slate-600">₹150 · 1-2 days</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {(error || hasBlockingStock || isCartEmpty) && (
              <div className="brand-alert rounded-2xl border p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[color:var(--brand-deep-green)] shadow-sm">!</div>
                  <div className="flex-1">
                    {error && <p className="font-semibold text-[color:var(--brand-deep-green)]">{error}</p>}

                    {isCartEmpty && (
                      <p className="mt-2 text-sm leading-6">Your cart currently has no items. Add products to continue checkout.</p>
                    )}

                    {hasBlockingStock && (
                      <div className="mt-4 rounded-2xl border border-[color:var(--brand-gold)]/45 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-950">
                          {stockIssues.length} item(s) need attention before checkout.
                        </p>
                        <ul className="mt-3 space-y-2 text-sm">
                          {stockIssues.map((issue) => (
                            <li key={issue.slug} className="rounded-xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/15 px-3 py-2 text-slate-700">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-slate-900">{issue.title}</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[color:var(--brand-deep-green)]">
                                  {issue.available === 0 ? "Out of stock" : `Only ${issue.available} available`}
                                </span>
                              </div>
                              <div className="mt-1 text-xs leading-6 text-slate-500">
                                Requested {issue.requested} · Available {issue.available}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => router.push('/cart')}
                      className="brand-btn-outline mt-4"
                    >
                      Back to cart
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="checkout-card p-5 shadow-sm shadow-slate-200/50 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Payment</h2>
                  <p className="mt-1 text-sm text-slate-500">{productionCheckoutDisabled ? "Live payment processing is not configured." : "Choose any non-COD payment method for this build."}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Final step</span>
              </div>
              {isCartEmpty && (
                <p className="brand-alert mt-3 rounded-2xl border px-4 py-3 text-sm">
                  Add products to your cart to continue.
                </p>
              )}
              {!isCartEmpty && !productionCheckoutDisabled && (
                <p className="brand-alert-soft mt-3 rounded-2xl border px-4 py-3 text-sm">
                  Demo mode active: checkout is using dummy payment only.
                </p>
              )}
              {!isCartEmpty && productionCheckoutDisabled && (
                <p role="status" className="brand-alert mt-3 rounded-2xl border px-4 py-3 text-sm">
                  Live checkout is unavailable. No payment or order will be processed.
                </p>
              )}
              {hasBlockingStock && !isCartEmpty && (
                <p className="brand-alert mt-3 rounded-2xl border px-4 py-3 text-sm">
                  Stock checks are skipped in dummy mode for testing.
                </p>
              )}
              {!productionCheckoutDisabled && <div className="mt-5 grid gap-3">
                {[
                  { id: "razorpay-card", label: "Card", note: "Visa, Mastercard, Rupay, Amex" },
                  { id: "razorpay-upi", label: "UPI", note: "Google Pay, PhonePe, Paytm, BHIM" },
                  { id: "razorpay-netbanking", label: "Netbanking", note: "All major banks supported" },
                  { id: "razorpay-wallet", label: "Wallets", note: "Paytm, Mobikwik, Freecharge, Amazon Pay" },
                ].map((option) => (
                  <label key={option.id} className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${paymentMethod === option.id ? 'border-[color:var(--brand-maroon)]/40 bg-[color:var(--brand-maroon)]/10 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.id}
                      checked={paymentMethod === option.id}
                      onChange={() => setPaymentMethod(option.id)}
                      className="mt-1 h-4 w-4 accent-[color:var(--brand-maroon)]"
                    />
                    <div>
                      <p className="font-semibold text-slate-950">{option.label}</p>
                      <p className="mt-1 text-sm text-slate-600">{option.note}</p>
                    </div>
                  </label>
                ))}
              </div>}
              {!productionCheckoutDisabled && <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{selectedPaymentLabel} details</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dummy entry</span>
                </div>

                {paymentMethod === "razorpay-card" && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Card holder name" className={inputClass} />
                    <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" className={inputClass} />
                    <input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className={inputClass} />
                    <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" className={inputClass} />
                    <div className="sm:col-span-2 rounded-2xl border border-dashed border-[color:var(--brand-gold)]/55 bg-white px-4 py-3 text-sm text-slate-600">
                      Dummy card flow: card verification, OTP, and capture would appear here in a real gateway.
                    </div>
                  </div>
                )}

                {paymentMethod === "razorpay-upi" && (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                      <input value={upiHandle} onChange={(e) => setUpiHandle(e.target.value)} placeholder="name@upi" className={inputClass} />
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">QR Code</p>
                        <div className="mt-3 flex items-center justify-center rounded-2xl border border-dashed border-[color:var(--brand-gold)]/55 bg-slate-50 p-5">
                          <div className="grid h-28 w-28 grid-cols-6 gap-1.5 rounded-2xl bg-white p-2 shadow-sm">
                            {Array.from({ length: 36 }).map((_, index) => (
                              <span key={index} className={`rounded-[3px] ${index % 3 === 0 || index % 4 === 0 ? "bg-slate-900" : "bg-slate-200"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Scan with any UPI app to complete the dummy payment step.</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-dashed border-[color:var(--brand-gold)]/55 bg-white px-4 py-3 text-sm text-slate-600">
                      Real UPI flow would show collect request, app switch, and payment confirmation here.
                    </div>
                  </div>
                )}

                {paymentMethod === "razorpay-netbanking" && (
                  <div className="mt-4 space-y-3">
                    <select value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass}>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                    </select>
                    <div className="rounded-2xl border border-dashed border-[color:var(--brand-gold)]/55 bg-white px-4 py-3 text-sm text-slate-600">
                      Dummy netbanking flow: bank login, OTP, and redirect confirmation would be shown here.
                    </div>
                  </div>
                )}

                {paymentMethod === "razorpay-wallet" && (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { id: "paytm", label: "Paytm" },
                        { id: "phonepe", label: "PhonePe" },
                        { id: "mobikwik", label: "MobiKwik" },
                        { id: "amazonpay", label: "Amazon Pay" },
                      ].map((wallet) => (
                        <label key={wallet.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 ${walletName === wallet.id ? "border-[color:var(--brand-maroon)]/40 bg-[color:var(--brand-maroon)]/10" : "border-slate-200 bg-white"}`}>
                          <input type="radio" name="walletName" checked={walletName === wallet.id} onChange={() => setWalletName(wallet.id)} className="h-4 w-4 accent-[color:var(--brand-maroon)]" />
                          <span className="text-sm font-semibold text-slate-900">{wallet.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-dashed border-[color:var(--brand-gold)]/55 bg-white px-4 py-3 text-sm text-slate-600">
                      Dummy wallet flow: wallet balance, approval, and confirmation would run here.
                    </div>
                  </div>
                )}

              </div>}
              <div className="mt-4">
                <button
                  onClick={() => void handlePay()}
                  disabled={productionCheckoutDisabled || loading || isCartEmpty || hasBlockingStock || !/^\d{6}$/.test(postal)}
                  className="brand-btn w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Processing…' : `Pay ₹${payable}`}
                </button>
                {!productionCheckoutDisabled && <button
                  onClick={() =>
                    void handlePay([
                      {
                        slug: "kolli-hills-turmeric",
                        title: "Kolli Hills Turmeric",
                        price: 90,
                        priceLabel: "₹90",
                        quantity: 1,
                      },
                    ])
                  }
                  disabled={loading}
                  className="brand-btn-outline mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Processing…' : 'Start Demo Checkout'}
                </button>}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
              <CartSummary shipping={shippingCost} discount={calculateOrderTotal(totals.subtotal, couponCode, null, shippingCost).discount} />
          </aside>
        </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
