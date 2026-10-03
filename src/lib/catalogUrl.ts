// Single place that turns catalogue filter state into a URL and back, shared by the server page and client filters.

export type FilterState = {
  q: string;
  sort: string;
  category: string[];
  origin: string[];
  heat: string[];
  inStock: boolean;
  offer: boolean;
  minPrice: string;
  maxPrice: string;
};

export const emptyFilters = (q = "", sort = ""): FilterState => ({ q, sort, category: [], origin: [], heat: [], inStock: false, offer: false, minPrice: "", maxPrice: "" });

const digits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "").slice(0, 6);
const unique = (values: string[]) => [...new Set(values.map((v) => v.trim().slice(0, 80)).filter(Boolean))].slice(0, 12);

export function readFilterState(get: (key: string) => string | null | undefined, getAll: (key: string) => string[]): FilterState {
  return {
    q: (get("q") ?? "").trim().slice(0, 80),
    sort: get("sort") ?? "",
    category: unique(getAll("category")),
    origin: unique(getAll("origin")),
    heat: unique(getAll("heat")),
    inStock: get("inStock") === "1",
    offer: get("offer") === "1",
    minPrice: digits(get("minPrice")),
    maxPrice: digits(get("maxPrice")),
  };
}

export function buildCatalogUrl(state: FilterState, page?: number) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  state.category.forEach((value) => params.append("category", value));
  state.origin.forEach((value) => params.append("origin", value));
  state.heat.forEach((value) => params.append("heat", value));
  if (state.minPrice) params.set("minPrice", state.minPrice);
  if (state.maxPrice) params.set("maxPrice", state.maxPrice);
  if (state.inStock) params.set("inStock", "1");
  if (state.offer) params.set("offer", "1");
  if (state.sort && state.sort !== "relevance") params.set("sort", state.sort);
  if (page && page > 1) params.set("page", String(page));
  const text = params.toString();
  return `/products${text ? `?${text}` : ""}`;
}

export const heatLabel = (value: string) => (value === "None" ? "Not spicy" : value);

export function countActiveFilters(state: FilterState) {
  return state.category.length + state.origin.length + state.heat.length + (state.minPrice || state.maxPrice ? 1 : 0) + (state.inStock ? 1 : 0) + (state.offer ? 1 : 0);
}

export type FilterChip = { id: string; label: string; next: FilterState };

export function activeChips(state: FilterState): FilterChip[] {
  const without = (changes: Partial<FilterState>): FilterState => ({ ...state, ...changes });
  const chips: FilterChip[] = [];
  state.category.forEach((value) => chips.push({ id: `category:${value}`, label: value, next: without({ category: state.category.filter((v) => v !== value) }) }));
  state.origin.forEach((value) => chips.push({ id: `origin:${value}`, label: value, next: without({ origin: state.origin.filter((v) => v !== value) }) }));
  state.heat.forEach((value) => chips.push({ id: `heat:${value}`, label: heatLabel(value), next: without({ heat: state.heat.filter((v) => v !== value) }) }));
  if (state.minPrice || state.maxPrice) {
    const label = state.minPrice && state.maxPrice ? `₹${state.minPrice} - ₹${state.maxPrice}` : state.minPrice ? `From ₹${state.minPrice}` : `Up to ₹${state.maxPrice}`;
    chips.push({ id: "price", label, next: without({ minPrice: "", maxPrice: "" }) });
  }
  if (state.inStock) chips.push({ id: "inStock", label: "In stock only", next: without({ inStock: false }) });
  if (state.offer) chips.push({ id: "offer", label: "On offer", next: without({ offer: false }) });
  return chips;
}

export const resetState = (state: FilterState): FilterState => emptyFilters(state.q, state.sort);
