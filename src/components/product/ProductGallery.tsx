"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryImage } from "@/lib/productImages";

const PLACEHOLDER = "/images/placeholder-product.svg";

// The skeleton sits behind the image and is covered as soon as the image paints, so a cached or
// server-rendered image never gets stuck hidden waiting for an onLoad that already fired.
function Img({ image, priority, className, onClick }: { image: GalleryImage; priority?: boolean; className?: string; onClick?: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative h-full w-full overflow-hidden bg-[color:var(--brand-cream)] ${className ?? ""}`}>
      <div className="absolute inset-0 animate-pulse bg-slate-200/70" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={(node) => {
          // A server-rendered image can fail before React attaches onError.
          if (node && !failed && node.complete && node.naturalWidth === 0) setFailed(true);
        }}
        src={failed ? PLACEHOLDER : image.src}
        alt={image.alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
        onClick={onClick}
        className={`relative h-full w-full bg-[color:var(--brand-cream)] object-cover ${onClick ? "cursor-zoom-in" : ""}`}
      />
    </div>
  );
}
function Lightbox({ images, index, onIndex, onClose }: { images: GalleryImage[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const last = images.length - 1;
  const step = useCallback((delta: number) => { setZoomed(false); onIndex((index + delta + images.length) % images.length); }, [index, images.length, onIndex]);

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight" && last > 0) step(1);
      else if (event.key === "ArrowLeft" && last > 0) step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step, last]);

  const image = images[index];
  return (
    <div role="dialog" aria-modal="true" aria-label={`${image.alt} image viewer`} className="fixed inset-0 z-[100] flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-sm">{index + 1} / {images.length}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setZoomed((z) => !z)} className="rounded-full border border-white/40 px-4 py-1.5 text-sm" aria-pressed={zoomed}>{zoomed ? "Zoom out" : "Zoom in"}</button>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close image viewer" className="rounded-full border border-white/40 px-4 py-1.5 text-sm">Close ✕</button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-auto" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className={`mx-auto flex min-h-full items-center justify-center p-4 ${zoomed ? "w-[200%] sm:w-[160%]" : "w-full"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt={image.alt} onClick={() => setZoomed((z) => !z)} className={`max-h-[80vh] w-auto max-w-full rounded-lg bg-white object-contain ${zoomed ? "max-h-none cursor-zoom-out" : "cursor-zoom-in"}`} />
        </div>
      </div>
      {last > 0 && (
        <>
          <button type="button" aria-label="Previous image" onClick={() => step(-1)} className="absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-white/90 text-2xl text-slate-900">‹</button>
          <button type="button" aria-label="Next image" onClick={() => step(1)} className="absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-white/90 text-2xl text-slate-900">›</button>
        </>
      )}
    </div>
  );
}

// With no real photos the gallery says so instead of passing a placeholder off as a product picture.
export default function ProductGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const real = images.length > 0;
  const list = real ? images : [{ src: PLACEHOLDER, alt: `${title} (photo coming soon)` }];
  const many = list.length > 1;
  const go = (delta: number) => setActive((i) => (i + delta + list.length) % list.length);

  return (
    <div className={many ? "flex flex-col lg:grid lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-4" : ""}>
      {many && (
        <ul className="order-2 mt-3 flex gap-2 overflow-x-auto lg:order-1 lg:mt-0 lg:flex-col lg:overflow-visible" aria-label="Product images">
          {list.map((image, i) => (
            <li key={image.src} className="shrink-0">
              <button type="button" onClick={() => setActive(i)} aria-label={`Show image ${i + 1} of ${list.length}`} aria-current={i === active} className={`block h-16 w-16 overflow-hidden rounded-lg border-2 ${i === active ? "border-[color:var(--brand-deep-green)]" : "border-transparent hover:border-[color:var(--brand-gold)]"}`}>
                <Img image={image} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="order-1 lg:order-2">
        <div
          className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[color:var(--brand-line)] bg-white"
          onTouchStart={(event) => { touchX.current = event.touches[0].clientX; }}
          onTouchEnd={(event) => {
            if (touchX.current === null || !many) return;
            const delta = event.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
          }}
        >
          <Img image={list[active]} priority={active === 0} onClick={real ? () => setOpen(true) : undefined} />
          {many && (
            <>
              <button type="button" aria-label="Previous image" onClick={() => go(-1)} className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 rounded-full bg-white/90 text-xl shadow sm:block">‹</button>
              <button type="button" aria-label="Next image" onClick={() => go(1)} className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 rounded-full bg-white/90 text-xl shadow sm:block">›</button>
            </>
          )}
          {real && (
            <button ref={opener} type="button" onClick={() => setOpen(true)} className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow">
              Zoom ⤢
            </button>
          )}
          {!real && <p className="absolute inset-x-0 bottom-0 bg-white/85 px-3 py-2 text-center text-xs text-slate-600">Product photo coming soon</p>}
          {many && <p className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white" aria-live="polite">{active + 1} / {list.length}</p>}
        </div>
      </div>
      {open && real && <Lightbox images={list} index={active} onIndex={setActive} onClose={() => { setOpen(false); opener.current?.focus(); }} />}
    </div>
  );
}
