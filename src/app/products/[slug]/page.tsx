import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import ProductCard from "@/components/products/ProductCard";
import ComboPacks from "@/components/home/ComboPacks";
import ProductGallery from "@/components/product/ProductGallery";
import ProductPurchase from "@/components/product/ProductPurchase";
import FrequentlyBought, { type BundleItem } from "@/components/product/FrequentlyBought";
import ProductReviews from "@/components/reviews/ProductReviews";
import PromoStrip from "@/components/pricing/PromoStrip";
import { loadCatalog } from "@/lib/catalog";
import { getProduct } from "@/lib/products";
import { getCombos } from "@/lib/homeData";
import { getProductImages } from "@/lib/productImages";
import { companionProducts, neighbours, pickInitialSize, productBadges, relatedProducts, splitUsage, stockOf } from "@/lib/productDetail";
import { shippingRates } from "@/lib/promotionConfig";
import { parsePrice } from "@/lib/cart";
import { clampRating, type StoredReview } from "@/lib/reviews";
import { readJson } from "@/lib/storage";
import { heatLabel } from "@/lib/catalogUrl";
import { site } from "@/config/site";
import type { SearchableProduct } from "@/lib/productSearch";

// Stock and price must be current for every visitor.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function findProduct(slug: string) {
  let catalog: SearchableProduct[] = [];
  try {
    catalog = await loadCatalog();
  } catch {
    catalog = [];
  }
  const fallback = getProduct(slug) as SearchableProduct | undefined;
  const product = catalog.find((p) => p.slug === slug) ?? fallback;
  return { product, catalog: catalog.length ? catalog : fallback ? [fallback] : [] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await findProduct(slug);
  if (!product) return { title: "Product not found | Spice Crowd" };
  return { title: `${product.title} | Spice Crowd`, description: (product.description || "").slice(0, 160) };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const { product, catalog } = await findProduct(slug);
  if (!product) notFound();

  const sizes = product.sizeOptions ?? [];
  const requestedSize = Array.isArray(query.size) ? query.size[0] : query.size;
  const initial = pickInitialSize(sizes, product, requestedSize);
  const images = getProductImages(product);
  const badges = productBadges(product);
  const { storage, use } = splitUsage(product.usage);
  const { previous, next } = neighbours(catalog, product);
  const companions = companionProducts(catalog, product);
  const related = relatedProducts(catalog, product);
  const combos = getCombos().filter((combo) => combo.items.some((item) => item.slug === product.slug) && combo.items.every((item) => (catalog.find((p) => p.slug === item.slug)?.stock ?? 10) > 0));
  const available = sizes.some((size) => stockOf(size, product) > 0);

  let reviews: StoredReview[] = [];
  try {
    const all = await readJson<StoredReview[]>("reviews.json", []);
    reviews = (Array.isArray(all) ? all : []).filter((review) => review.product === product.slug);
  } catch {
    reviews = [];
  }
  const average = reviews.length ? reviews.reduce((sum, review) => sum + clampRating(review.rating), 0) / reviews.length : 0;

  const bundle = (p: SearchableProduct): BundleItem => {
    const size = p.sizeOptions?.[0];
    return { slug: p.slug, title: p.title, price: size?.price ?? p.price, sku: size?.sku, sizeLabel: size?.label ?? "", inStock: stockOf(size, p) > 0 };
  };

  const unitPrice = parsePrice(initial?.price ?? product.price);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: initial?.sku,
    category: product.category,
    brand: { "@type": "Brand", name: site.name },
    image: images.map((image) => (image.src.startsWith("http") ? image.src : `${site.website}${image.src}`)),
    offers: { "@type": "Offer", priceCurrency: "INR", price: unitPrice, availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${site.website}/products/${product.slug}` },
    ...(reviews.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(average.toFixed(1)), reviewCount: reviews.length } } : {}),
  };

  const origin = product.origin || product.location;

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li><Link href="/" className="hover:text-slate-900 hover:underline">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/products" className="hover:text-slate-900 hover:underline">Products</Link></li>
            {product.category && (
              <>
                <li aria-hidden="true">›</li>
                <li><Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-slate-900 hover:underline">{product.category}</Link></li>
              </>
            )}
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-medium text-slate-900">{product.title}</li>
          </ol>
        </nav>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <ProductGallery images={images} title={product.title} />

          <div>
            {badges.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Product badges">
                {badges.map((badge) => <li key={badge} className="rounded-full bg-[color:var(--brand-gold)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-deep-green)]">{badge}</li>)}
              </ul>
            )}
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{product.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {product.category && <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="font-semibold text-[color:var(--brand-deep-green)] hover:underline">{product.category}</Link>}
              {product.category && origin && " · "}
              {origin && <>From <Link href={`/products?origin=${encodeURIComponent(origin)}`} className="font-semibold text-[color:var(--brand-deep-green)] hover:underline">{origin}</Link></>}
            </p>
            {reviews.length > 0 && (
              <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700 hover:underline">
                <span className="text-[color:var(--brand-gold)]" aria-hidden="true">{"★".repeat(Math.round(average))}</span>
                <span>{average.toFixed(1)} out of 5 · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
              </a>
            )}

            <div className="mt-6 rounded-2xl border border-[color:var(--brand-line)] bg-white p-5 shadow-sm sm:p-6">
              {sizes.length > 0 ? (
                <ProductPurchase product={{ slug: product.slug, title: product.title, price: product.price, mrp: typeof product.mrp === "number" ? product.mrp : null, stock: product.stock }} sizes={sizes} initialSize={initial?.label} />
              ) : (
                <p className="text-sm text-slate-600">This product is not available to order right now.</p>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-[color:var(--brand-line)] bg-[color:var(--brand-cream)] p-5 text-sm text-slate-700">
              <h2 className="text-base font-semibold text-slate-900">Delivery and returns</h2>
              <ul className="mt-2 space-y-1.5">
                <li>Standard delivery: ₹{shippingRates.standard}, estimated 3-5 days</li>
                <li>Express delivery: ₹{shippingRates.express}, estimated 1-2 days</li>
                <li>The delivery charge is confirmed at checkout before you pay.</li>
              </ul>
              <PromoStrip kind="free_shipping" className="mt-2 font-semibold" />
              <p className="mt-3">Received a damaged, incorrect or unsatisfactory order? You can request a return or refund from your order page. Our team reviews each request; return windows have not been published yet. <Link href="/support#returns" className="font-semibold text-[color:var(--brand-deep-green)] underline">Returns policy</Link></p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-8">
            {product.description && (
              <section aria-labelledby="about-heading">
                <h2 id="about-heading" className="text-xl font-bold text-slate-900">About this product</h2>
                <p className="mt-3 text-base leading-7 text-slate-700">{product.description}</p>
              </section>
            )}
            {use.length > 0 && (
              <section aria-labelledby="use-heading">
                <h2 id="use-heading" className="text-xl font-bold text-slate-900">How to use</h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-7 text-slate-700">{use.map((line) => <li key={line}>{line}</li>)}</ul>
              </section>
            )}
            {storage.length > 0 && (
              <section aria-labelledby="storage-heading">
                <h2 id="storage-heading" className="text-xl font-bold text-slate-900">Storage</h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-7 text-slate-700">{storage.map((line) => <li key={line}>{line}</li>)}</ul>
              </section>
            )}
            {product.pairWith?.length > 0 && (
              <section aria-labelledby="pairs-heading">
                <h2 id="pairs-heading" className="text-xl font-bold text-slate-900">Pairs well with</h2>
                <ul className="mt-3 flex flex-wrap gap-2">{product.pairWith.map((name) => <li key={name} className="rounded-full border border-[color:var(--brand-line)] bg-white px-3 py-1 text-sm text-slate-700">{name}</li>)}</ul>
              </section>
            )}
          </div>

          <section aria-labelledby="details-heading" className="h-fit rounded-2xl border border-[color:var(--brand-line)] bg-white p-5 sm:p-6">
            <h2 id="details-heading" className="text-xl font-bold text-slate-900">Product details</h2>
            <dl className="mt-3 divide-y divide-[color:var(--brand-line)]">
              {product.category && <Row label="Category">{product.category}</Row>}
              {origin && <Row label="Origin">{origin}</Row>}
              {product.flavor && <Row label="Flavour">{product.flavor}</Row>}
              {product.heatLevel && <Row label="Heat level">{heatLabel(product.heatLevel)}</Row>}
              {sizes.length > 0 && <Row label="Pack sizes">{sizes.map((size) => size.label).join(", ")}</Row>}
            </dl>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              Ingredients, packaging, best-before and certification details are not listed for this product yet. Ask us before you buy on{" "}
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="font-semibold underline">{site.phone}</a> or{" "}
              <a href="https://wa.me/916374334813?text=Hello%20Spice%20Crowd%2C%20I%20have%20a%20question%20about%20a%20product" target="_blank" rel="noreferrer" className="font-semibold underline">WhatsApp</a>.
            </p>
          </section>
        </div>

        {companions.length > 0 && sizes.length > 0 && (
          <div className="mt-12"><FrequentlyBought main={bundle(product)} companions={companions.map(bundle)} /></div>
        )}
      </main>

      {combos.length > 0 && (
        <div className="mt-12">
          <ComboPacks combos={combos} id="product-combos" eyebrow="Combos" heading="Sets that include this product" />
        </div>
      )}

      <div className="mx-auto mt-12 max-w-6xl space-y-12 px-4 pb-28 sm:px-6 lg:px-8 lg:pb-12">
        <div id="reviews" className="scroll-mt-28"><ProductReviews slug={product.slug} /></div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-2xl font-bold text-slate-900">You may also like</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{related.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
          </section>
        )}

        {(previous || next) && (
          <nav aria-label="More in this category" className="flex flex-wrap justify-between gap-3 border-t border-[color:var(--brand-line)] pt-6 text-sm">
            {previous ? <Link href={`/products/${previous.slug}`} className="brand-btn-outline">← {previous.title}</Link> : <span />}
            {next ? <Link href={`/products/${next.slug}`} className="brand-btn-outline">{next.title} →</Link> : <span />}
          </nav>
        )}
      </div>
      <Footer />
    </>
  );
}
