"use client";

import { useState } from "react";

type FaqItem = { question: string; answer: string };

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return <div className="divide-y divide-[color:var(--brand-line)] overflow-hidden rounded-2xl border border-[color:var(--brand-line)] bg-white">
    {items.map((item, index) => {
      const expanded = open === index;
      return <div key={item.question}>
        <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : index)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-900 transition hover:bg-[color:var(--brand-cream)]">
          <span>{item.question}</span><span aria-hidden="true" className="text-xl font-normal text-[color:var(--brand-gold)]">{expanded ? "-" : "+"}</span>
        </button>
        {expanded && <div className="px-5 pb-5 text-sm leading-7 text-slate-600"><p>{item.answer}</p></div>}
      </div>;
    })}
  </div>;
}
