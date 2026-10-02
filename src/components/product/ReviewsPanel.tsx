"use client";
import React from 'react';
import { motion } from 'framer-motion';
import ReviewFloating from './ReviewFloating';

type Review = {
  author: string;
  rating: number;
  text: string;
};

function Stars({ n }: { n: number }){
  return <div className="flex gap-1">{Array.from({length:5}).map((_,i)=> <span key={i} className={`text-sm ${i<n? 'text-[color:var(--brand-gold)]':'text-slate-300'}`}>★</span>)}</div>;
}

export default function ReviewsPanel({ reviews = [] }: { reviews?: Review[] }){
  const r = reviews.length ? reviews : [
    { author: 'Priya S.', rating: 5, text: 'Amazing aroma and flavor.' },
    { author: 'Ravi K.', rating: 4, text: 'Good quality, slightly pricey.' },
    { author: 'Anita M.', rating: 5, text: 'Will reorder for sure.' },
  ];
  const avg = Math.round((r.reduce((s,a)=>s+(a.rating||5),0)/r.length));
  const counts = [5,4,3,2,1].map(star => r.filter(x=>x.rating===star).length);

  return (
    <div className="mt-6 relative">
      <div className="flex items-center gap-6">
        <div>
          <div className="text-3xl font-bold">{(r.reduce((s,a)=>s+(a.rating||5),0)/r.length).toFixed(1)}</div>
          <Stars n={avg} />
          <div className="text-sm text-slate-500">{r.length} reviews</div>
        </div>

        <div className="flex-1">
          {counts.map((c,i)=> (
            <div key={i} className="flex items-center gap-3 mb-2">
              <div className="text-xs w-6 text-right">{5-i}★</div>
              <div className="w-full bg-slate-100 rounded overflow-hidden h-3">
                <motion.div initial={{ width:0 }} animate={{ width: `${(c / Math.max(1, r.length))*100}%` }} className="h-3 bg-[color:var(--brand-gold)]" />
              </div>
              <div className="w-8 text-xs text-slate-600 text-right">{c}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {r.slice(0,3).map((rev,idx)=> (
          <div key={idx} className="p-3 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{rev.author}</div>
              <div className="text-sm text-slate-500">{rev.rating}★</div>
            </div>
            <div className="text-sm text-slate-700 mt-2">{rev.text}</div>
          </div>
        ))}
      </div>

      <div className="absolute right-0 -top-10">
        <ReviewFloating review={r[0]} />
      </div>
    </div>
  );
}
