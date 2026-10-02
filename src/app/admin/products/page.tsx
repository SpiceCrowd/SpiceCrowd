"use client";

import { useEffect, useState } from 'react';

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  description?: string;
  tag?: string;
  stock?: number;
};

type EditableProduct = {
  title: string;
  slug: string;
  price: string;
  description: string;
  tag: string;
  stock: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditableProduct>({ title: '', slug: '', price: '', description: '', tag: '', stock: '' });
  const [error, setError] = useState<string | null>(null);

  const adminHeaders = (): HeadersInit => {
    const token = localStorage.getItem('sc_token');
    return token ? { authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetch('/api/admin/products', { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]));
  }, []);

  const refresh = () => {
    fetch('/api/admin/products', { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]));
  };

  const startEdit = (product: Product) => {
    setEditingSlug(product.slug);
    setEditForm({
      title: product.title,
      slug: product.slug,
      price: String(product.price),
      description: product.description || '',
      tag: product.tag || '',
      stock: typeof product.stock === 'number' ? String(product.stock) : '',
    });
  };

  const cancelEdit = () => {
    setEditingSlug(null);
    setEditForm({ title: '', slug: '', price: '', description: '', tag: '', stock: '' });
  };

  const handleSave = async () => {
    setError(null);
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({
        slug: editForm.slug,
        title: editForm.title,
        price: editForm.price,
        description: editForm.description,
        tag: editForm.tag,
        stock: editForm.stock,
      }),
    });
    if (res.ok) {
      cancelEdit();
      refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Unable to save product');
    }
  };

  const handleDelete = async (slugToDelete: string) => {
    setError(null);
    const res = await fetch(`/api/admin/products?slug=${encodeURIComponent(slugToDelete)}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
    if (res.ok) {
      if (editingSlug === slugToDelete) {
        cancelEdit();
      }
      refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Unable to delete product');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ title, slug, price }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Unable to create product');
      return;
    }
    if (file && data.created) {
      const fd = new FormData();
      fd.append('slug', slug);
      fd.append('file', file);
      const uploadRes = await fetch('/api/admin/products/upload', { method: 'POST', headers: adminHeaders(), body: fd });
      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json().catch(() => ({}));
        setError(uploadData.error || 'Product created, but image upload failed');
      }
    }
    setTitle('');
    setSlug('');
    setPrice('');
    setFile(null);
    refresh();
  };

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-bold">Admin — Products</h1>
      <p className="mt-2 text-sm text-slate-600">Create and manage products (basic UI).</p>
      {error && <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="mt-6 space-y-4">
        <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2" />
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug (unique)" className="rounded-xl border border-slate-200 px-3 py-2" />
            <input value={price} onChange={(e) => setPrice(Number(e.target.value) || '')} placeholder="Price" className="rounded-xl border border-slate-200 px-3 py-2" />
          </div>
          <div className="flex items-center gap-3">
            <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
            <button type="submit" className="rounded-full bg-[color:var(--brand-deep-green)] px-4 py-2 text-[color:var(--brand-gold)]">Create</button>
          </div>
        </form>

        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {editingSlug === p.slug ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={editForm.title} onChange={(e) => setEditForm((current) => ({ ...current, title: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Title" />
                  <input value={editForm.slug} onChange={(e) => setEditForm((current) => ({ ...current, slug: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Slug" />
                  <input value={editForm.price} onChange={(e) => setEditForm((current) => ({ ...current, price: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Price" />
                  <input value={editForm.stock} onChange={(e) => setEditForm((current) => ({ ...current, stock: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Stock" />
                </div>
                <input value={editForm.tag} onChange={(e) => setEditForm((current) => ({ ...current, tag: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Tag" />
                <textarea value={editForm.description} onChange={(e) => setEditForm((current) => ({ ...current, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Description" rows={3} />
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleSave} className="rounded-full bg-[color:var(--brand-deep-green)] px-4 py-2 text-[color:var(--brand-gold)]">Save</button>
                  <button type="button" onClick={cancelEdit} className="rounded-full border border-slate-200 px-4 py-2 text-slate-700">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">{p.title}</div>
                  <div className="text-sm text-slate-500">{p.slug}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-semibold">₹{p.price}</div>
                  <button type="button" onClick={() => startEdit(p)} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">Edit</button>
                  <button type="button" onClick={() => handleDelete(p.slug)} className="rounded-full border border-[color:var(--brand-gold)]/50 px-4 py-2 text-sm text-[color:var(--brand-deep-green)]">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
