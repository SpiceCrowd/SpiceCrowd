"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { parsePrice } from "@/lib/cart";
import { getProducts, type Product } from "@/lib/products";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import ProductReviews from "@/components/reviews/ProductReviews";

export default function ProductDetailClient({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product.sizeOptions?.[0] || null);
  const { addItem } = useCart();
  const router = useRouter();

  const allProducts = getProducts();
  const selectedStock = selectedSize?.stock ?? product.stock ?? 10;

  const handleBuyNow = () => {
    const priceLabel = selectedSize?.price || product.price;
    addItem({
      slug: product.slug,
      variantId: selectedSize?.sku,
      title: product.title + (selectedSize ? ` • ${selectedSize.label}` : ""),
      price: parsePrice(priceLabel),
      priceLabel,
      quantity,
    });
    router.push("/checkout");
  };

  const addBundleToCart = (bundleItems: string[]) => {
    bundleItems.forEach((bundleName) => {
      const match = allProducts.find((item) => item.title.toLowerCase().includes(bundleName.toLowerCase()));
      if (!match) {
        return;
      }
      addItem({
        slug: match.slug,
        variantId: match.sizeOptions?.[0]?.sku,
        title: match.title,
        price: parsePrice(match.price),
        priceLabel: match.price,
        quantity: 1,
      });
    });
  };

  const comboPacks = [
    { title: "Everyday basics", items: ["Turmeric", "Black Pepper", "Ginger"] },
    { title: "Curry and gravy set", items: ["Turmeric", "Black Pepper", "Coriander", "Ginger"] },
    { title: "Warm spice set", items: ["Black Pepper", "Cinnamon", "Cloves"] },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-center justify-start">
        <Link
          href="/products"
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-[color:var(--brand-gold)] hover:bg-slate-50"
        >
          ← Back to catalog
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[1.5rem] bg-slate-50 p-5 shadow-sm shadow-slate-200/40">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-[color:var(--brand-deep-green)]">{product.origin}</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{product.title}</h1>
              </div>
              <span className="rounded-full bg-[color:var(--brand-gold)]/26 px-3 py-1 text-xs font-semibold text-[color:var(--brand-deep-green)] sm:text-sm">{product.tag}</span>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="mx-auto mb-5 flex items-center justify-center">
                <div className="h-64 w-64 overflow-hidden rounded-full border-2 border-slate-200 bg-[color:var(--brand-gold)]/15 sm:h-72 sm:w-72">
                  <ImageWithFallback slug={product.slug} alt={product.title} className="h-64 w-64 object-cover sm:h-72 sm:w-72" />
                </div>
              </div>
              <p className="text-[15px] leading-7 text-slate-700">{product.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-slate-900">Flavor</h2>
                <p className="mt-2 text-sm text-slate-600">{product.flavor}</p>
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-slate-900">Heat level</h2>
                <p className="mt-2 text-sm text-slate-600">{product.heatLevel}</p>
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">Usage Guide</h2>
              <p className="mt-2 text-sm text-slate-600">{product.usage}</p>
            </div>

            <section className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">Frequently Bought Together</h2>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                {product.frequentlyBought.map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-3 text-center text-sm text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.2rem] border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-deep-green)]">Combo Packs</p>
                <p className="text-xs text-slate-500">Quick add</p>
              </div>

              <div className="mt-3 space-y-2">
                {comboPacks.map((pack) => (
                  <div key={pack.title} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{pack.title}</p>
                      <p className="text-xs text-slate-500">{pack.items.join(", ")} at regular prices</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addBundleToCart(pack.items)}
                      className="shrink-0 rounded-full border border-[color:var(--brand-gold)]/50 px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-deep-green)] transition hover:bg-[color:var(--brand-gold)]/20"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <ProductReviews slug={product.slug} />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Price</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">{selectedSize?.price || product.price}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3.5">
              <div className="space-y-2 rounded-[1rem] bg-slate-50 p-3.5 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Size options</p>
                <div className="grid gap-2 sm:grid-cols-4">
                  {product.sizeOptions.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      disabled={(option.stock ?? product.stock ?? 10) <= 0}
                      onClick={() => setSelectedSize(option)}
                      className={`rounded-full border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
                        selectedSize?.label === option.label
                          ? 'border-[color:var(--brand-deep-green)] bg-[color:var(--brand-gold)]/20 text-[color:var(--brand-deep-green)]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-[color:var(--brand-gold)]'
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className="block text-[10px]">{(option.stock ?? 0) > 0 ? `${option.stock} left` : "Out"}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                  <span>SKU: <strong className="text-slate-900">{selectedSize?.sku || "-"}</strong></span>
                  <span>{selectedStock > 0 ? `${selectedStock} available` : "Out of stock"}</span>
                </div>
              </div>
              <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Quantity</p>
                <div className="mt-2.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 transition hover:border-[color:var(--brand-gold)]"
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] text-center text-lg font-semibold text-slate-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => current + 1)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 transition hover:border-[color:var(--brand-gold)]"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="rounded-[1rem] bg-[color:var(--brand-deep-green)] p-3.5 text-white">
                <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--brand-gold)]">Delivery</p>
                <p className="mt-1.5 text-sm text-[color:var(--brand-gold)]/90">Free shipping above ₹500 | Non-returnable</p>
              </div>
              <button
                type="button"
                onClick={handleBuyNow}
                className="brand-btn w-full px-6 py-3 text-center"
              >
                Buy Now
              </button>
              <AddToCartButton
                disabled={selectedStock <= 0}
                item={{
                  slug: product.slug,
                  variantId: selectedSize?.sku,
                  title: product.title + (selectedSize ? ` • ${selectedSize.label}` : ""),
                  price: parsePrice(selectedSize?.price || product.price),
                  priceLabel: selectedSize?.price || product.price,
                  quantity,
                }}
              />
              <button className="w-full rounded-full border border-[color:var(--brand-gold)]/40 bg-[color:var(--brand-gold)] px-6 py-3 text-sm font-semibold text-[color:var(--brand-deep-green)] transition hover:bg-[color:var(--brand-gold)]/85">
                Bulk Order
              </button>
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Pair with</p>
            <div className="mt-3 space-y-2.5">
              {product.pairWith.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
