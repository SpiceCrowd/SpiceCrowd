"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { buildCatalogUrl, countActiveFilters, heatLabel, resetState, type FilterState } from "@/lib/catalogUrl";
import type { SearchFacets } from "@/lib/productSearch";

type Props = {
  state: FilterState;
  facets: SearchFacets;
  sortOptions: Array<{ value: string; label: string }>;
  sort: string;
  total: number;
  summary: ReactNode;
  chips: ReactNode;
  children: ReactNode;
};

const COMMIT_DELAY_MS = 350;

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-[color:var(--brand-line)] pb-4">
      <legend className="mb-2 text-sm font-semibold text-slate-900">{title}</legend>
      <div className="space-y-1.5">{children}</div>
    </fieldset>
  );
}

function Check({ checked, onChange, label, count, disabled }: { checked: boolean; onChange: () => void; label: string; count?: number; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-2 text-sm ${disabled ? "text-slate-400" : "cursor-pointer text-slate-700"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="h-4 w-4 accent-[color:var(--brand-deep-green)]" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-slate-500">{count}</span>}
    </label>
  );
}

type Change = "apply" | "typing";

// Only groups backed by real catalogue data are rendered; a group with a single possible value is not a useful filter.
function FilterFields({ draft, setDraft, flush, facets, idPrefix }: { draft: FilterState; setDraft: (next: FilterState, change?: Change) => void; flush: () => void; facets: SearchFacets; idPrefix: string }) {
  const showGroup = (values: Array<{ name: string }>, selected: string[]) => values.length > 1 || selected.length > 0;
  const numeric = (value: string) => value.replace(/\D/g, "").slice(0, 6);
  const input = "w-full rounded-lg border border-[color:var(--brand-line)] px-3 py-2 text-sm";
  const onKey = (event: React.KeyboardEvent) => event.key === "Enter" && flush();

  return (
    <div className="space-y-4">
      {showGroup(facets.categories, draft.category) && (
        <Group title="Category">
          {facets.categories.map((facet) => (
            <Check key={facet.name} label={facet.name} count={facet.count} checked={draft.category.includes(facet.name)} onChange={() => setDraft({ ...draft, category: toggle(draft.category, facet.name) })} />
          ))}
          {draft.category.filter((name) => !facets.categories.some((f) => f.name === name)).map((name) => (
            <Check key={name} label={name} count={0} checked onChange={() => setDraft({ ...draft, category: toggle(draft.category, name) })} />
          ))}
        </Group>
      )}

      {facets.price && facets.price.min < facets.price.max && (
        <Group title="Price (₹)">
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`${idPrefix}-min`}>Minimum price</label>
            <input id={`${idPrefix}-min`} inputMode="numeric" placeholder={String(facets.price.min)} value={draft.minPrice} onChange={(e) => setDraft({ ...draft, minPrice: numeric(e.target.value) }, "typing")} onBlur={flush} onKeyDown={onKey} className={input} />
            <span aria-hidden="true">-</span>
            <label className="sr-only" htmlFor={`${idPrefix}-max`}>Maximum price</label>
            <input id={`${idPrefix}-max`} inputMode="numeric" placeholder={String(facets.price.max)} value={draft.maxPrice} onChange={(e) => setDraft({ ...draft, maxPrice: numeric(e.target.value) }, "typing")} onBlur={flush} onKeyDown={onKey} className={input} />
          </div>
        </Group>
      )}

      <Group title="Availability">
        <Check label="In stock only" count={facets.availability.inStock} checked={draft.inStock} onChange={() => setDraft({ ...draft, inStock: !draft.inStock })} />
      </Group>

      {showGroup(facets.origins, draft.origin) && (
        <Group title="Origin">
          {facets.origins.map((facet) => (
            <Check key={facet.name} label={facet.name} count={facet.count} checked={draft.origin.includes(facet.name)} onChange={() => setDraft({ ...draft, origin: toggle(draft.origin, facet.name) })} />
          ))}
        </Group>
      )}

      {showGroup(facets.heat, draft.heat) && (
        <Group title="Heat level">
          {facets.heat.map((facet) => (
            <Check key={facet.name} label={heatLabel(facet.name)} count={facet.count} checked={draft.heat.includes(facet.name)} onChange={() => setDraft({ ...draft, heat: toggle(draft.heat, facet.name) })} />
          ))}
        </Group>
      )}

      {facets.offers !== null && (
        <Group title="Offers">
          <Check label="Products with an offer" count={facets.offers} checked={draft.offer} onChange={() => setDraft({ ...draft, offer: !draft.offer })} />
        </Group>
      )}
    </div>
  );
}

// Desktop: choices apply after a short pause so several clicks produce one request and one history entry.
function LivePanel({ state, facets, go }: { state: FilterState; facets: SearchFacets; go: (next: FilterState) => void }) {
  const [draft, setDraft] = useState(state);
  const timer = useRef<number | undefined>(undefined);
  const urlKey = buildCatalogUrl(state);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [syncedKey, setSyncedKey] = useState(urlKey);
  // The URL we asked for arriving must not discard clicks made while it loaded; any other change (chips, back/forward) resets the panel.
  if (urlKey !== syncedKey) {
    setSyncedKey(urlKey);
    if (urlKey === pendingUrl) setPendingUrl(null);
    else setDraft(state);
  }
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const commit = (next: FilterState) => {
    window.clearTimeout(timer.current);
    setPendingUrl(buildCatalogUrl(next));
    go(next);
  };
  const update = (next: FilterState, change: Change = "apply") => {
    setDraft(next);
    if (change === "typing") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commit(next), COMMIT_DELAY_MS);
  };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Filters</h2>
        {countActiveFilters(draft) > 0 && <button type="button" onClick={() => { const cleared = resetState(draft); setDraft(cleared); commit(cleared); }} className="text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">Reset filters</button>}
      </div>
      <FilterFields draft={draft} setDraft={update} flush={() => commit(draft)} facets={facets} idPrefix="desktop" />
    </div>
  );
}
// Mobile: a bottom sheet; choices are staged and applied together so nothing reloads while the sheet is open.
function Sheet({ state, facets, total, onClose, go }: { state: FilterState; facets: SearchFacets; total: number; onClose: () => void; go: (next: FilterState) => void }) {
  const [draft, setDraft] = useState(state);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeHandler = useRef(onClose);
  useEffect(() => {
    closeHandler.current = onClose;
  });

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeHandler.current();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Filter products" className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[color:var(--brand-line)] px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Filters</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close filters" className="rounded-full px-3 py-1 text-2xl leading-none text-slate-600">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <FilterFields draft={draft} setDraft={setDraft} flush={() => undefined} facets={facets} idPrefix="mobile" />
        </div>
        <div className="flex gap-3 border-t border-[color:var(--brand-line)] px-5 py-4">
          <button type="button" onClick={() => setDraft(resetState(draft))} className="brand-btn-outline flex-1">Reset</button>
          <button type="button" onClick={() => { go(draft); onClose(); }} className="brand-btn flex-[2]">{countActiveFilters(draft) === countActiveFilters(state) && JSON.stringify(draft) === JSON.stringify(state) ? `Show ${total} products` : "Apply filters"}</button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogFilters({ state, facets, sortOptions, sort, total, summary, chips, children }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const active = countActiveFilters(state);
  const urlKey = buildCatalogUrl(state);

  const go = (next: FilterState) => {
    const url = buildCatalogUrl(next);
    if (url === urlKey) return;
    startTransition(() => router.push(url, { scroll: false }));
  };

  const closeSheet = () => {
    setSheetOpen(false);
    opener.current?.focus();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[color:var(--brand-line)] py-3">
        <div className="flex items-center gap-3">
          <button ref={opener} type="button" onClick={() => setSheetOpen(true)} className="brand-btn-outline lg:hidden" aria-haspopup="dialog">
            Filters{active > 0 ? ` (${active})` : ""}
          </button>
          {summary}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>Sort</span>
          <select aria-label="Sort products" value={sort} onChange={(event) => go({ ...state, sort: event.target.value })} className="form-input min-w-40 py-2">
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {chips}

      <div className="relative mt-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block" aria-label="Product filters">
          <LivePanel state={state} facets={facets} go={go} />
        </aside>
        <div aria-busy={pending} className="relative min-h-[28rem]">
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden ${pending ? "opacity-100" : "opacity-0"} transition-opacity`} aria-hidden="true">
            <div className="h-full w-1/3 animate-pulse bg-[color:var(--brand-deep-green)]" />
          </div>
          <div className={`transition-opacity duration-150 ${pending ? "opacity-50" : "opacity-100"}`}>{children}</div>
          <p className="sr-only" role="status">{pending ? "Updating results" : ""}</p>
        </div>
      </div>

      {sheetOpen && <Sheet key={urlKey} state={state} facets={facets} total={total} onClose={closeSheet} go={go} />}
    </div>
  );
}
