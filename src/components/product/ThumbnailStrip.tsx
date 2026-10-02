"use client";
import React from 'react';
import Image from 'next/image';

export default function ThumbnailStrip({ images = [], onOpen, selected = 0 }: { images?: string[]; onOpen?: (i:number)=>void; selected?: number }) {
  return (
    <div className="mt-4 flex gap-2 overflow-x-auto py-2">
      {images.map((src, i) => (
        <button type="button" key={i} onClick={() => onOpen?.(i)} className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border ${i===selected ? 'border-[color:var(--brand-deep-green)] ring-2 ring-[color:var(--brand-gold)]/35':'border-slate-200'}`}>
          <Image src={src} alt={`thumb-${i}`} fill sizes="64px" className="object-cover" />
        </button>
      ))}
    </div>
  );
}
