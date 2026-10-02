"use client";
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function Lightbox({ images = [], index = 0, open = false, onClose = ()=>{} }:{ images?: string[]; index?: number; open?: boolean; onClose?: ()=>void }){
  const [currentIndex, setCurrentIndex] = React.useState<number | null>(null);

  const activeIndex = currentIndex ?? index;

  useEffect(()=>{
    function moveIndex(nextIndex: number | ((value: number) => number)) {
      setCurrentIndex((value) => {
        const resolvedCurrent = value ?? index;
        return typeof nextIndex === 'function' ? nextIndex(resolvedCurrent) : nextIndex;
      });
    }

    function onKey(e: KeyboardEvent){ if(e.key==='Escape') onClose(); if(e.key==='ArrowLeft') moveIndex(x=>Math.max(0,x-1)); if(e.key==='ArrowRight') moveIndex(x=>Math.min(images.length-1,x+1)); }
    if(open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  },[open, images.length, onClose, index]);

  const moveIndex = (nextIndex: number | ((value: number) => number)) => {
    setCurrentIndex((value) => {
      const resolvedCurrent = value ?? index;
      return typeof nextIndex === 'function' ? nextIndex(resolvedCurrent) : nextIndex;
    });
  };

  const imageSrc = images[activeIndex] || "/images/placeholder-product.svg";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-50 flex items-center justify-center">
          <div onClick={onClose} className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 max-w-4xl w-full px-4">
            <motion.div key={imageSrc} initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-2xl">
              <Image src={imageSrc} alt={`lightbox-${activeIndex}`} fill sizes="(max-width: 1024px) 100vw, 1024px" className="object-contain" />
            </motion.div>
            <button type="button" onClick={()=>moveIndex(x=>Math.max(0,x-1))} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center">◀</button>
            <button type="button" onClick={()=>moveIndex(x=>Math.min(images.length-1,x+1))} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center">▶</button>
            <button type="button" onClick={onClose} className="absolute right-4 top-4 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
