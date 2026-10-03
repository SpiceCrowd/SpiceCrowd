"use client";

import Link from "next/link";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { parsePrice } from "@/lib/cart";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import type { Product } from "@/lib/products";

export type CardProduct = Pick<Product, "slug" | "title" | "price" | "tag" | "stock"> & { sizeOptions?: Array<{ sku?: string }> };

export default function ProductCard({ product }: { product: CardProduct }) {
  const { toggle, has } = useWishlist();
  const wishlisted = has(product.slug);

  return (
    <article className="surface-lift group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--brand-line)] bg-white p-3 shadow-sm">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative mb-4 overflow-hidden rounded-xl bg-[color:var(--brand-cream)]">
          <div className="aspect-[4/3] w-full overflow-hidden">
            <ImageWithFallback
              slug={product.slug}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <button
            type="button"
            aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
            aria-pressed={wishlisted}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggle(product.slug);
            }}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-lg shadow-sm transition ${wishlisted ? "text-[color:var(--brand-deep-green)]" : "text-slate-600 hover:text-[color:var(--brand-gold)]"}`}
          >
            {wishlisted ? "♥" : "♡"}
          </button>
        </div>

        <div className="px-1">
          <h3 className="font-sans text-base font-semibold text-slate-900">{product.title}</h3>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">100g</p>
              <p className="mt-1 text-xl font-bold text-[color:var(--brand-deep-green)]">{product.price}</p>
            </div>
            <div className="rounded-md bg-[color:var(--brand-cream)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-deep-green)]">{product.tag}</div>
          </div>
          <p className={`mt-2 text-xs font-semibold ${product.stock === 0 ? "text-red-700" : product.stock !== undefined && product.stock <= 3 ? "text-amber-700" : "text-[color:var(--brand-deep-green)]"}`}>
            {product.stock === 0 ? "Out of stock" : product.stock !== undefined && product.stock <= 3 ? `Only ${product.stock} left` : "In stock"}
          </p>
        </div>
      </Link>

      <div className="mt-auto px-1 pt-4">
        <AddToCartButton
          disabled={product.stock === 0}
          item={{
            slug: product.slug,
            variantId: product.sizeOptions?.[0]?.sku,
            title: product.title,
            price: parsePrice(product.price),
            priceLabel: product.price,
          }}
        />
      </div>
    </article>
  );
}
