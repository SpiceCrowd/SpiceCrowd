import { getProducts } from "@/lib/products";
import ProductCard from "@/components/products/ProductCard";

const products = getProducts();

export default function FeaturedProducts() {
  return (
    <section className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Our Finest Picks</p>
        <h2 className="section-heading mt-3">Handpicked spices from Kolli Hills</h2>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, 3).map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
