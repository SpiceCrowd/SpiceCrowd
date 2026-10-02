"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ProductImage from "./ProductImage";
import ProductDetails from "./ProductDetails";
import ThumbnailStrip from './ThumbnailStrip';
import Lightbox from './Lightbox';
import ReviewsPanel from './ReviewsPanel';
import type { Product } from "@/lib/products";

type ProductReview = {
  author: string;
  rating: number;
  text: string;
};

type ProductViewItem = Product & {
  id?: string;
  image?: string;
  images?: string[];
  reviews?: ProductReview[] | number;
};

export default function ProductSingleView({ products, initialSlug }: { products: ProductViewItem[]; initialSlug?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const initialActive = Math.max(
    0,
    initialSlug
      ? products.findIndex((product) => product.slug === initialSlug || product.id === initialSlug)
      : 0,
  );
  const [active, setActive] = useState(initialActive);
  const [thumbIndex, setThumbIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const idx = Math.round(el.scrollTop / window.innerHeight);
      setActive(Math.max(0, Math.min(products.length - 1, idx)));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [products.length]);

  useEffect(() => {
    if (!initialSlug || !products || !products.length) return;
    const idx = products.findIndex((product) => product.slug === initialSlug || product.id === initialSlug);
    if (idx >= 0) {
      // Force the container to the right section on first load so deep links open correctly.
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;
        const targetTop = idx * window.innerHeight;
        container.scrollTo({ top: targetTop, behavior: "auto" });
      });
    }
  }, [initialSlug, products]);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.code === "Space") {
        e.preventDefault();
        const next = Math.min(products.length - 1, active + 1);
        sectionRefs.current[next]?.scrollIntoView({ behavior: "smooth" });
        setActive(next);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        const prev = Math.max(0, active - 1);
        sectionRefs.current[prev]?.scrollIntoView({ behavior: "smooth" });
        setActive(prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, products.length]);

  const sectionVariant = {
    hidden: (dir: number) => ({ opacity: 0, y: 120 * dir, scale: 0.98, rotate: dir * 1 }),
    visible: { opacity: 1, y: 0, scale: 1, rotate: 0 },
  };

  const imageVariant = {
    hidden: (dir: number) => ({ opacity: 0, x: dir * 120, scale: 0.98 }),
    visible: { opacity: 1, x: 0, scale: 1 },
  };

  const detailsVariant = {
    hidden: (dir: number) => ({ opacity: 0, x: -dir * 80, y: 30, scale: 0.98 }),
    visible: { opacity: 1, x: 0, y: 0, scale: 1 },
  };

  return (
    <div ref={containerRef} style={{ height: "100vh", overflowY: "auto", scrollSnapType: "y mandatory" }}>
      <div className="sticky top-3 z-20 mx-4 mb-2 flex justify-start">
        <div
          data-active-product="true"
          aria-live="polite"
          className="rounded-full border border-[color:var(--brand-gold)]/50 bg-white/95 px-4 py-2 text-xs font-semibold tracking-wide text-[color:var(--brand-deep-green)] shadow-sm backdrop-blur"
        >
          Now viewing: {products[active]?.title || "Spice details"}
        </div>
      </div>
      {products.map((p: ProductViewItem, i: number) => {
        const isActive = i === active;
        const dir = i > active ? 1 : i < active ? -1 : 0;
        const galleryImages = (p.images || [p.image]).filter((image): image is string => Boolean(image));
        const reviews = Array.isArray(p.reviews) ? p.reviews : undefined;
        return (
          <motion.section
            key={p.id || p.slug || i}
            custom={dir}
            initial={"hidden"}
            animate={isActive ? "visible" : "hidden"}
            variants={sectionVariant}
            transition={{ duration: 0.6, ease: "easeOut" }}
              ref={(el: HTMLDivElement | null) => { sectionRefs.current[i] = el; }}
            data-active={isActive ? "true" : "false"}
            style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "start", padding: "2rem" }}
          >
            <div style={{ maxWidth: 1200, width: "100%", display: "flex", gap: 24 }}>
              <div className="flex-1 flex items-center justify-center">
                <motion.div custom={dir} initial="hidden" animate={isActive ? 'visible' : 'hidden'} variants={imageVariant} transition={{ duration: 0.6 }}>
                  <ProductImage src={galleryImages} alt={p.title || 'Product image'} />
                  <ThumbnailStrip images={galleryImages} selected={thumbIndex} onOpen={(index)=>{ setThumbIndex(index); setLightboxOpen(true); }} />
                  <Lightbox images={galleryImages} index={thumbIndex} open={lightboxOpen} onClose={()=>setLightboxOpen(false)} />
                </motion.div>
              </div>
              <div className="flex-1">
                <motion.div custom={dir} initial="hidden" animate={isActive ? 'visible' : 'hidden'} variants={detailsVariant} transition={{ duration: 0.6, delay: 0.05 }}>
                  <ProductDetails product={p} />
                  <ReviewsPanel reviews={reviews} />
                </motion.div>
              </div>
            </div>
          </motion.section>
        );
      })}
      <div className="fixed right-6 bottom-10 flex flex-col gap-3">
        <button
          aria-label="Previous product"
          onClick={() => {
            const prev = Math.max(0, active - 1);
            sectionRefs.current[prev]?.scrollIntoView({ behavior: 'smooth' });
            setActive(prev);
          }}
          className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center"
        >
          ◀
        </button>

        <button
          aria-label="Next product"
          onClick={() => {
            const next = Math.min(products.length - 1, active + 1);
            sectionRefs.current[next]?.scrollIntoView({ behavior: 'smooth' });
            setActive(next);
          }}
          className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
