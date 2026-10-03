"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

type Suggestion = { slug: string; title: string; price: string; category: string; inStock: boolean };
type SuggestData = { products: Suggestion[]; categories: Array<{ name: string; count: number }>; correctedFrom: string | null };
type Option =
  | { kind: "product"; key: string; product: Suggestion }
  | { kind: "category"; key: string; name: string; count: number }
  | { kind: "recent"; key: string; term: string }
  | { kind: "all"; key: string; term: string };

const MIN_CHARS = 2;
const DEBOUNCE_MS = 200;
const CACHE_TTL_MS = 30_000;
const RECENT_KEY = "sc_recent_searches";
const cache = new Map<string, { at: number; data: SuggestData }>();

function readRecents(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((term): term is string => typeof term === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  try {
    const next = [term, ...readRecents().filter((existing) => existing.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); recents are optional.
  }
}

export default function SearchBox({ initialValue = "", variant = "header", autoFocus = false }: { initialValue?: string; variant?: "header" | "page"; autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [data, setData] = useState<SuggestData | null>(null);
  const [dataFor, setDataFor] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [active, setActive] = useState(-1);

  const term = value.trim();
  const ready = term.length >= MIN_CHARS;
  const current = ready && dataFor === term ? data : null;

  useEffect(() => {
    if (!ready) return;
    const cached = cache.get(term.toLowerCase());
    const fresh = cached && Date.now() - cached.at < CACHE_TTL_MS ? cached.data : null;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (fresh) {
        setData(fresh);
        setDataFor(term);
        setFailed(false);
        return;
      }
      setLoading(true);
      setFailed(false);
      try {
        const response = await fetch(`/api/products/suggest?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error("suggest failed");
        const next: SuggestData = { products: json.products, categories: json.categories, correctedFrom: json.correctedFrom ?? null };
        cache.set(term.toLowerCase(), { at: Date.now(), data: next });
        setData(next);
        setDataFor(term);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, fresh ? 0 : DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [term, ready]);

  const options = useMemo<Option[]>(() => {
    if (!term) return recents.map((recent) => ({ kind: "recent", key: `r-${recent}`, term: recent }));
    const list: Option[] = [];
    if (current) {
      current.products.forEach((product) => list.push({ kind: "product", key: `p-${product.slug}`, product }));
      current.categories.forEach((category) => list.push({ kind: "category", key: `c-${category.name}`, ...category }));
    }
    list.push({ kind: "all", key: "all", term });
    return list;
  }, [term, current, recents]);

  function go(path: string) {
    setOpen(false);
    setActive(-1);
    router.push(path);
  }

  function search(text: string) {
    const clean = text.trim();
    if (!clean) return go("/products");
    saveRecent(clean);
    go(`/products?q=${encodeURIComponent(clean)}`);
  }

  function choose(option: Option) {
    if (option.kind === "product") {
      saveRecent(option.product.title);
      go(`/products/${option.product.slug}`);
    } else if (option.kind === "category") go(`/products?category=${encodeURIComponent(option.name)}`);
    else search(option.term);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      if (!options.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (index + step + options.length) % options.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && active >= 0 && options[active]) choose(options[active]);
      else search(value);
    } else if (event.key === "Escape") {
      if (open) setOpen(false);
      else if (value) setValue("");
      setActive(-1);
    }
  }

  function clear() {
    setValue("");
    setActive(-1);
    setOpen(true);
    inputRef.current?.focus();
  }

  const expanded = open && options.length > 0;
  const big = variant === "page";
  const status = !ready ? "" : loading ? "Searching" : failed ? "Suggestions are unavailable" : current ? `${current.products.length} product suggestions` : "";

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          search(value);
        }}
        className={`flex items-center overflow-hidden border border-[color:var(--brand-line)] bg-white shadow-sm focus-within:border-[color:var(--brand-deep-green)] ${big ? "rounded-2xl" : "rounded-xl"}`}
      >
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search products by name, SKU, category or spice"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          maxLength={80}
          autoFocus={autoFocus}
          value={value}
          placeholder="Search spices, SKU or category"
          onChange={(event) => {
            setValue(event.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => {
            setRecents(readRecents());
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={`w-full bg-transparent text-slate-800 placeholder:text-slate-500 focus:outline-none ${big ? "px-5 py-4 text-base" : "px-4 py-3 text-sm"}`}
        />
        {value && (
          <button type="button" onClick={clear} aria-label="Clear search" className="px-3 text-xl text-slate-500 hover:text-slate-900">
            ×
          </button>
        )}
        <button type="submit" aria-label="Search" className={`flex items-center justify-center bg-[color:var(--brand-deep-green)] font-semibold text-white transition hover:bg-[color:var(--brand-maroon-700)] ${big ? "h-14 px-6 text-base" : "h-12 w-12 text-xl text-[color:var(--brand-gold)]"}`}>
          {big ? "Search" : "⌕"}
        </button>
      </form>

      <p className="sr-only" role="status" aria-live="polite">{status}</p>

      {open && (term || recents.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-[color:var(--brand-line)] bg-white p-2 text-left shadow-xl">
          {!term && <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent searches</p>}
          {term && !ready && <p className="px-3 py-2 text-sm text-slate-500">Keep typing to see suggestions.</p>}
          {ready && loading && !current && <p className="px-3 py-3 text-sm text-slate-500">Searching…</p>}
          {ready && failed && !loading && <p className="px-3 py-3 text-sm text-amber-700">Suggestions could not load. Press Enter to search anyway.</p>}
          {ready && current && current.products.length === 0 && current.categories.length === 0 && !loading && (
            <p className="px-3 py-3 text-sm text-slate-600">No quick matches for &ldquo;{term}&rdquo;. Press Enter to see all results and alternatives.</p>
          )}
          {ready && current?.correctedFrom && <p className="px-3 py-1 text-xs text-slate-500">Showing matches for a corrected spelling.</p>}
          <ul id={listId} role="listbox" aria-label="Search suggestions">
            {options.map((option, index) => (
              <li
                key={option.key}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={active === index}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${active === index ? "bg-[color:var(--brand-cream)]" : ""}`}
              >
                {option.kind === "product" && (
                  <>
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[color:var(--brand-cream)]">
                      <ImageWithFallback slug={option.product.slug} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{option.product.title}</p>
                      <p className="truncate text-xs text-slate-500">{option.product.category}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-[color:var(--brand-deep-green)]">{option.product.price}</p>
                      {!option.product.inStock && <p className="text-xs font-semibold text-red-700">Out of stock</p>}
                    </div>
                  </>
                )}
                {option.kind === "category" && <span>Browse <strong>{option.name}</strong> <span className="text-slate-500">({option.count})</span></span>}
                {option.kind === "recent" && <span className="text-slate-700">↺ {option.term}</span>}
                {option.kind === "all" && <span className="font-semibold text-[color:var(--brand-deep-green)]">See all results for &ldquo;{option.term}&rdquo; →</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
