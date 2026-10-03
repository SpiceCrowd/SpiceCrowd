"use client";
import React from "react";
import Image from "next/image";
import ProductCarousel from "./ProductCarousel";

export default function ProductImage({ src, alt }: { src?: string | string[]; alt?: string }) {
  // `src` may be a single string or array of images
  const images = Array.isArray(src) ? src : src ? [src] : [];
  if (images.length > 1) {
    return <ProductCarousel images={images} alt={alt} />;
  }

  const image = images[0] || "/images/placeholder-product.svg";
  return (
    <div className="w-full max-w-[540px] rounded-2xl overflow-hidden shadow-lg bg-white relative">
      <div className="relative aspect-[4/3] w-full">
        <Image src={image} alt={alt || "product"} fill sizes="(max-width: 540px) 100vw, 540px" className="block object-cover" />
      </div>
    </div>
  );
}
