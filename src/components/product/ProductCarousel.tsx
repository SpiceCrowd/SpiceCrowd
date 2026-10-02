"use client";
import React, { useState, useRef } from 'react';
import Image from 'next/image';

export default function ProductCarousel({ images = [], alt }: { images: string[]; alt?: string }) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(images.length - 1, i + 1));

  return (
    <div style={{ width: '100%', maxWidth: 540, position: 'relative' }}>
      <div
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const end = e.changedTouches[0].clientX;
          if (startX.current == null) return;
          const delta = end - startX.current;
          if (delta > 40) prev();
          if (delta < -40) next();
          startX.current = null;
        }}
        style={{ overflow: 'hidden', borderRadius: 12 }}
      >
        <div style={{ display: 'flex', width: `${images.length * 100}%`, transform: `translateX(-${index * (100 / images.length)}%)`, transition: 'transform 400ms ease' }}>
          {images.map((src, i) => (
            <div key={i} style={{ flex: `0 0 ${100 / images.length}%`, paddingRight: 0, position: 'relative', aspectRatio: '4 / 3' }}>
              <Image src={src || '/images/placeholder-product.svg'} alt={alt || 'product'} fill sizes="(max-width: 540px) 100vw, 540px" style={{ objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>

      {/* controls */}
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Prev image" onClick={prev} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', width: 36, height: 36, borderRadius: 999 }}>
            ‹
          </button>
          <button type="button" aria-label="Next image" onClick={next} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', width: 36, height: 36, borderRadius: 999 }}>
            ›
          </button>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {images.map((_, i) => (
              <button type="button" key={i} onClick={() => setIndex(i)} aria-label={`Go to image ${i + 1}`} style={{ width: 8, height: 8, borderRadius: 999, background: i === index ? '#065f46' : '#d1d5db', border: 'none' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
