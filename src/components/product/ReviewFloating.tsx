"use client";
import React from 'react';
import { motion } from 'framer-motion';

type Review = {
  author: string;
  rating?: number;
  text: string;
};

export default function ReviewFloating({ review }: { review?: Review }) {
  const r = review || { author: 'Priya S.', text: 'Amazing quality! The aroma fills my kitchen. Very fresh and authentic.' };
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, repeatType: 'loop' }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg max-w-sm border"
      style={{ borderColor: 'rgba(229,231,235,0.8)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[color:var(--brand-gold)]/24 flex items-center justify-center text-[color:var(--brand-deep-green)] font-semibold">P</div>
        <div>
          <div className="text-sm font-semibold">{r.author}</div>
          <div className="text-xs text-slate-500">5 days ago</div>
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-700">{r.text}</div>
    </motion.div>
  );
}
