import fs from "fs";
import path from "path";
import type { SearchableProduct } from "@/lib/productSearch";

export type GalleryImage = { src: string; alt: string };

const IMAGE_FILE = /\.(svg|jpe?g|png|webp|avif)$/i;

// Real artwork only: database images first, then files in /public/images named <slug>.<ext> or <slug>-2.<ext>.
export function getProductImages(product: SearchableProduct): GalleryImage[] {
  const images: GalleryImage[] = (product.images ?? [])
    .filter((image) => image.url)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((image) => ({ src: image.url, alt: image.alt || product.title }));

  try {
    const dir = path.join(process.cwd(), "public", "images");
    const pattern = new RegExp(`^${product.slug.replace(/[^a-z0-9-]/gi, "")}(-\\d+)?\\.`, "i");
    const order = (file: string) => Number(file.match(/-(\d+)\.[a-z]+$/i)?.[1] ?? 0);
    const files = fs.readdirSync(dir).filter((file) => pattern.test(file) && IMAGE_FILE.test(file)).sort((a, b) => order(a) - order(b) || a.localeCompare(b));
    for (const file of files) {
      const src = `/images/${file}`;
      if (!images.some((image) => image.src === src)) images.push({ src, alt: product.title });
    }
  } catch {
    // No local artwork folder; fall through to the placeholder state.
  }
  return images;
}
