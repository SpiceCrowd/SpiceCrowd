"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

type Review = {
  id: string;
  product: string | null;
  rating: number;
  text: string;
  createdAt: string;
};

type ReviewForm = {
  product: string;
  rating: number;
  text: string;
};

type ReviewsResponse = {
  reviews?: Review[];
};

async function fetchReviews(): Promise<Review[]> {
  const res = await fetch('/api/reviews');
  const data = (await res.json()) as ReviewsResponse;
  return data.reviews || [];
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [form, setForm] = useState<ReviewForm>({ product: "", rating: 5, text: "" });
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<{ slug: string; title: string }[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchReviews()
        .then(setReviews)
        .catch(() => setReviews([]))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch('/api/products').then((response) => response.json()).then((data) => setProducts(data.products || [])).catch(() => setProducts([]));
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    setError('');
    const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || 'Unable to submit review');
      return;
    }
    setMessage('Review submitted successfully.');
    setForm({ product: '', rating: 5, text: '' });
    setReviews(await fetchReviews());
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900">Reviews</h1>
        <form onSubmit={submit} className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <select required value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className="w-full rounded-lg border px-3 py-2">
            <option value="">Select a product</option>
            {products.map((product) => <option key={product.slug} value={product.slug}>{product.title}</option>)}
          </select>
          <input type="number" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} min={1} max={5} className="rounded-lg border px-3 py-2" />
          <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="w-full rounded-lg border px-3 py-2" placeholder="Your review" />
          <button className="brand-btn px-4 py-2 text-sm">Submit review</button>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}
        </form>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900">All reviews</h2>
          {loading ? <p className="mt-3 text-sm text-slate-500">Loading reviews...</p> : null}
          <ul className="mt-4 space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="font-semibold text-slate-900">{r.product ?? "General"} - {r.rating} ★</div>
                <div className="mt-1 text-sm text-slate-700">{r.text}</div>
                <div className="mt-1 text-xs text-slate-500">{r.createdAt}</div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
