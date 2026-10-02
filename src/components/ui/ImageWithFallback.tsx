"use client";

import { useState } from "react";

const availableImageSlugs = new Set([
  "bay-leaf",
  "black-pepper",
  "cardamom",
  "cardamom-powder",
  "cinnamon",
  "cinnamon-powder",
  "clove",
  "filter-coffee-powder",
  "kolli-hills-black-pepper",
  "kolli-hills-turmeric",
  "roasted-coffee-beans",
  "white-pepper",
]);

export default function ImageWithFallback({
  slug,
  alt = "",
  className = "",
  sizes,
}: {
  slug: string;
  alt?: string;
  className?: string;
  sizes?: string;
}) {
  const [src, setSrc] = useState(availableImageSlugs.has(slug) ? `/images/${slug}.svg` : "/images/placeholder-product.svg");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || slug}
      className={className}
      sizes={sizes}
      onError={() => {
        // try jpg next
        if (src.endsWith(".svg")) {
          setSrc(`/images/${slug}.jpg`);
          return;
        }
        // fallback placeholder
        setSrc(`/images/placeholder-product.svg`);
      }}
    />
  );
}
