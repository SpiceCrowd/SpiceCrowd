"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import { trackingStatusLabels } from "@/lib/tracking";

type OrderItem = {
  slug?: string;
  title?: string;
  quantity?: number;
  price?: number;
  lineTotal?: number;
};

type OrderView = {
  id: string;
  status?: string;
  fulfillmentStatus?: string;
  createdAt?: string;
  total?: number;
  subtotal?: number;
  discount?: number;
  delivery?: number;
  promotions?: Array<{ id: string; title: string; code?: string; kind: string; amount: number }>;
  shipping?: { method?: string; cost?: number; baseCost?: number; discount?: number };
  tax?: number;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal?: string;
  };
  payment?: {
    method?: string;
    provider?: string;
  };
  items?: OrderItem[];
  tracking?: Tracking;
};

type ReturnRequest = { id: string; status: string; reason: string; createdAt: string };
type Tracking = { courier?: string; courierMode?: string; trackingNumber?: string; status?: string; estimate?: string; pickupAddress?: string; collectionAddress?: string; events?: Array<{ status: string; at: string }> };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(amount || 0)));
}

function titleFromSlug(slug?: string) {
  if (!slug) return "Spice Item";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function TrackPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const readLocalFallback = () => {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem("sc_last_order");
        if (!raw) return null;
        const parsed = JSON.parse(raw) as OrderView;
        if (parsed?.id && String(parsed.id) === String(id)) {
          return parsed;
        }
      } catch {
        return null;
      }
      return null;
    };

    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('sc_token') : null;
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['authorization'] = `Bearer ${token}`;
        const guestEmail = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('email') : null;
        const guestQuery = guestEmail ? `?email=${encodeURIComponent(guestEmail)}` : '';
        const res = await fetch(`/api/orders/${id}${guestQuery}`, { headers });
        const json = await res.json();
        if (!json.success) {
          const fallback = readLocalFallback();
          if (fallback) {
            setOrder(fallback);
            setError(null);
            return;
          }
          setError(json.error || 'Unable to fetch order');
          return;
        }
        setOrder(json.order as OrderView);
        const returnToken = typeof window !== 'undefined' ? localStorage.getItem('sc_token') : null;
        if (returnToken) {
          const returnResponse = await fetch(`/api/returns?orderId=${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${returnToken}` } });
          const returnJson = await returnResponse.json().catch(() => ({}));
          setReturnRequest(returnJson.requests?.[0] || null);
        }
      } catch (err: any) {
        const fallback = readLocalFallback();
        if (fallback) {
          setOrder(fallback);
          setError(null);
          return;
        }
        setError(String(err.message || err));
      }
    })();
  }, [id]);

  const normalizedItems = (order?.items || []).map((item, index) => {
    const qty = Math.max(1, Number(item.quantity || 1));
    const unitPrice = Number(item.price || 0);
    const lineTotal = Number(item.lineTotal || unitPrice * qty);
    return {
      index,
      title: item.title || titleFromSlug(item.slug),
      qty,
      unitPrice,
      lineTotal,
    };
  });

  const computedSubtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotal = Number(order?.subtotal ?? computedSubtotal);
  const discountPromotions = (order?.promotions || []).filter((promo) => promo.kind === "discount");
  const discount = Number(order?.discount ?? 0);
  const delivery = Number(order?.delivery ?? order?.shipping?.cost ?? 0);
  const shippingWaived = Number(order?.shipping?.discount ?? 0);
  const tax = Number(order?.tax ?? 0);
  const grandTotal = Number(order?.total ?? subtotal - discount + delivery + tax);
  const invoiceDate = order?.createdAt ? new Date(order.createdAt) : new Date();
  const invoiceNumber = order?.id ? order.id.replace(/^ORDER_/, "SC/") : "SC/NEW";
  const paymentMode = (order?.payment?.method || "upi").toUpperCase();
  const orderStatusLabel = (order?.status || "paid").replace(/_/g, " ");
  const fulfillmentStatusLabel = (order?.fulfillmentStatus || "processing").replace(/_/g, " ");

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  const handleShare = async () => {
    if (typeof window === "undefined" || !order) return;

    const shareData = {
      title: `Spice Crowd Invoice ${invoiceNumber}`,
      text: `Invoice ${invoiceNumber} for ${formatCurrency(grandTotal)}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      setShareMessage("Invoice link copied to clipboard.");
      window.setTimeout(() => setShareMessage(null), 3000);
    } catch {
      // Ignore cancelled share prompts.
    }
  };

  return (
    <>
      <Header />
      {shareMessage && <div role="status" className="fixed right-4 top-4 z-[80] rounded-xl bg-[color:var(--brand-deep-green)] px-4 py-3 text-sm font-semibold text-white shadow-lg">{shareMessage}</div>}
      <main className="bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,var(--brand-deep-green)_24%,transparent),_transparent_28%),radial-gradient(circle_at_bottom_right,_color-mix(in_srgb,var(--brand-gold)_24%,transparent),_transparent_34%),linear-gradient(145deg,_#02150f_0%,_#03261a_55%,_#0b2f20_100%)] py-8 sm:py-10">
        {order ? (
          <div className="fixed right-3 top-20 z-30 flex flex-col gap-2 sm:right-4 sm:top-24">
            <button
              type="button"
              onClick={handlePrint}
              className="brand-btn-outline px-3 py-2 text-xs sm:px-4 sm:py-2.5"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="brand-btn px-3 py-2 text-xs sm:px-4 sm:py-2.5"
            >
              Share
            </button>
          </div>
        ) : null}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-2xl rounded-[1.6rem] border border-[color:var(--brand-gold)]/45 bg-[#031f16]/95 p-4 text-[color:var(--brand-gold)]/90 shadow-[0_18px_55px_rgba(0,0,0,0.42)] sm:p-5 md:p-6">
            {!id && <div className="rounded-xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/15 px-4 py-3 text-sm">Order id missing.</div>}
            {error && <div className="rounded-xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/15 px-4 py-3 text-sm">{error}</div>}

            {order && (
              <div className="space-y-5">
                <header className="grid gap-4 border-b border-[color:var(--brand-gold)]/35 pb-5 lg:grid-cols-[1fr_0.9fr]">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--brand-gold)]/80">Spice Crowd</p>
                    <h1 className="mt-1.5 text-3xl font-black tracking-tight text-[color:var(--brand-gold)] sm:text-4xl">BILL / INVOICE</h1>
                    <p className="mt-1.5 text-sm italic text-[color:var(--brand-gold)]/85 sm:text-base">From the Hills of India to Your Home</p>
                  </div>
                  <div className="rounded-2xl border border-[color:var(--brand-gold)]/45 bg-black/15 p-3.5 text-xs sm:text-sm">
                    <div className="flex justify-between gap-4 border-b border-[color:var(--brand-gold)]/25 pb-2">
                      <span className="text-[color:var(--brand-gold)]/80">Invoice No</span>
                      <span className="font-semibold">{invoiceNumber}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-4 border-b border-[color:var(--brand-gold)]/25 pb-2">
                      <span className="text-[color:var(--brand-gold)]/80">Date</span>
                      <span className="font-semibold">{invoiceDate.toLocaleDateString("en-GB")}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-4 border-b border-[color:var(--brand-gold)]/25 pb-2">
                      <span className="text-[color:var(--brand-gold)]/80">Payment</span>
                      <span className="font-semibold">{paymentMode} (Dummy)</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-4">
                      <span className="text-[color:var(--brand-gold)]/80">Status</span>
                      <span className="font-semibold uppercase">{orderStatusLabel}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-4">
                      <span className="text-[color:var(--brand-gold)]/80">Fulfillment</span>
                      <span className="font-semibold uppercase">{fulfillmentStatusLabel}</span>
                    </div>
                  </div>
                </header>

                {order.tracking && (
                  <section id="tracking" className="scroll-mt-24 rounded-2xl border border-[color:var(--brand-gold)]/35 bg-black/10 p-3.5 sm:p-4 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--brand-gold)]/75">Dummy delivery tracking</p>
                        <p className="mt-2 font-semibold">{order.tracking.courier} · {order.tracking.trackingNumber}</p>
                        <p className="mt-1 text-[color:var(--brand-gold)]/75">{order.tracking.courierMode}</p>
                      </div>
                      <span className="rounded-full bg-[color:var(--brand-gold)] px-3 py-1 text-xs font-bold uppercase text-[#052113]">{trackingStatusLabels[(order.tracking.status || "order_confirmed") as keyof typeof trackingStatusLabels]}</span>
                    </div>
                    <p className="mt-3 text-[color:var(--brand-gold)]/85">Estimated delivery: {order.tracking.estimate}</p>
                    {order.tracking.collectionAddress && <p className="mt-1 text-[color:var(--brand-gold)]/85">Collection point: {order.tracking.collectionAddress}</p>}
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {(order.tracking.events || []).map((event) => <div key={`${event.status}-${event.at}`} className="rounded-xl border border-[color:var(--brand-gold)]/25 bg-[#06281a]/80 p-2 text-xs"><p className="font-semibold">{trackingStatusLabels[event.status as keyof typeof trackingStatusLabels] || event.status}</p><p className="mt-1 text-[color:var(--brand-gold)]/65">{new Date(event.at).toLocaleString()}</p></div>)}
                    </div>
                  </section>
                )}

                <section className="rounded-2xl border border-[color:var(--brand-gold)]/35 bg-black/10 p-3.5 sm:p-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--brand-gold)]/75">Customer details</p>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p><span className="text-[color:var(--brand-gold)]/70">Customer Name:</span> {order.customer?.name || "Guest Customer"}</p>
                    <p><span className="text-[color:var(--brand-gold)]/70">Contact:</span> {order.customer?.phone || "-"}</p>
                    <p className="sm:col-span-2"><span className="text-[color:var(--brand-gold)]/70">Address:</span> {[order.customer?.address, order.customer?.city, order.customer?.postal].filter(Boolean).join(", ") || "-"}</p>
                  </div>
                </section>

                <section className="rounded-2xl border border-[color:var(--brand-gold)]/35 bg-black/10 p-3.5 sm:p-4 text-sm">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--brand-gold)]/75">Returns and refunds</p>
                  {returnRequest ? (
                    <p className="mt-2">Request {returnRequest.id}: <span className="font-semibold uppercase">{returnRequest.status}</span></p>
                  ) : (
                    <a className="mt-2 inline-block font-semibold underline" href={`/returns?orderId=${encodeURIComponent(id)}`}>Request a return or refund</a>
                  )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-[color:var(--brand-gold)]/45">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead className="bg-[color:var(--brand-gold)] text-[#052113]">
                      <tr>
                        <th className="px-2.5 py-2.5 font-extrabold">S.No</th>
                        <th className="px-2.5 py-2.5 font-extrabold">Description</th>
                        <th className="px-2.5 py-2.5 font-extrabold">Qty</th>
                        <th className="px-2.5 py-2.5 font-extrabold">Unit Price</th>
                        <th className="px-2.5 py-2.5 font-extrabold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalizedItems.map((item) => (
                        <tr key={`${item.title}-${item.index}`} className="border-t border-[color:var(--brand-gold)]/30 bg-[#06281a]/90">
                          <td className="px-2.5 py-2">{item.index + 1}</td>
                          <td className="px-2.5 py-2 font-medium">{item.title}</td>
                          <td className="px-2.5 py-2">{item.qty}</td>
                          <td className="px-2.5 py-2">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-2.5 py-2 font-semibold">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="ml-auto w-full max-w-sm overflow-hidden rounded-2xl border border-[color:var(--brand-gold)]/45 text-xs sm:text-sm">
                  <div className="flex items-center justify-between border-b border-[color:var(--brand-gold)]/30 bg-[#06281a]/90 px-3.5 py-2.5">
                    <span>Sub Total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (discountPromotions.length ? discountPromotions : [{ id: "discount", title: "Discount", code: undefined, kind: "discount", amount: discount }]).map((promo) => (
                    <div key={promo.id} className="flex items-center justify-between border-b border-[color:var(--brand-gold)]/30 bg-[#06281a]/90 px-3.5 py-2.5">
                      <span>{promo.code ? `Coupon ${promo.code}` : promo.title}</span>
                      <span>-{formatCurrency(promo.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-b border-[color:var(--brand-gold)]/30 bg-[#06281a]/90 px-3.5 py-2.5">
                    <span>Delivery</span>
                    <span>{shippingWaived > 0 && delivery === 0 ? "Free" : formatCurrency(delivery)}</span>
                  </div>
                  {tax > 0 && (
                    <div className="flex items-center justify-between border-b border-[color:var(--brand-gold)]/30 bg-[#06281a]/90 px-3.5 py-2.5">
                      <span>GST</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between bg-[color:var(--brand-gold)] px-3.5 py-3 text-base font-black text-[#052113] sm:text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </section>

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--brand-gold)]/35 pt-4 text-xs text-[color:var(--brand-gold)]/85 sm:text-sm">
                  <p>Thank you for choosing Spice Crowd.</p>
                  <p>Pure Spices. Better Food. Healthier You.</p>
                </footer>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
