import { parsePrice } from "@/lib/cart";
import type { Product } from "@/lib/products";

export type SearchableProduct = Product & { category?: string; sku?: string | null };

export type SearchItem = {
  slug: string;
  title: string;
  price: string;
  priceValue: number;
  tag: string;
  category: string;
  origin: string;
  stock: number;
  inStock: boolean;
  sku: string | null;
  sizeOptions: Array<{ sku?: string }>;
};

export type SearchSort = "relevance" | "price-low" | "price-high" | "name";

export type SearchParams = {
  q?: string | null;
  category?: string | null;
  origin?: string | null;
  sort?: string | null;
  inStock?: boolean;
  maxPrice?: number | null;
  page?: number;
  pageSize?: number;
};

export type SearchResult = {
  items: SearchItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
  correctedFrom: string | null;
  correctedTo: string | null;
  sort: SearchSort;
  facets: { categories: Array<{ name: string; count: number }>; origins: Array<{ name: string; count: number }> };
};

export const MAX_QUERY_LENGTH = 80;
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

const sorts: SearchSort[] = ["relevance", "price-low", "price-high", "name"];
// Title, SKU, category, tag and origin are what a product is; flavour, pairings and prose only mention other products.
const PRIMARY_WEIGHT = 3;

export function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function sanitizeQuery(value: unknown) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, MAX_QUERY_LENGTH) : "";
}

function tokenize(value: string) {
  return normalizeText(value).split(" ").filter(Boolean).slice(0, 8);
}

type Indexed = {
  product: SearchableProduct;
  skus: string[];
  fields: Array<{ weight: number; words: string[]; text: string }>;
  titleText: string;
};

function field(weight: number, value: unknown) {
  const text = normalizeText(Array.isArray(value) ? value.join(" ") : value);
  return { weight, words: text.split(" ").filter(Boolean), text };
}

function productSkus(product: SearchableProduct) {
  return [product.sku, ...(product.sizeOptions || []).map((option) => option.sku)].filter((sku): sku is string => Boolean(sku));
}

function index(product: SearchableProduct): Indexed {
  const skus = productSkus(product);
  return {
    product,
    skus,
    titleText: normalizeText(product.title),
    fields: [
      field(6, product.title),
      field(5, skus),
      field(4, product.category),
      field(3, product.tag),
      field(3, product.origin || product.location),
      field(2, product.flavor),
      field(2, product.heatLevel),
      field(2, product.pairWith),
      field(1, product.description),
      field(1, product.usage),
    ],
  };
}

function singular(token: string) {
  return token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token;
}

function tokenScore(entry: Indexed, token: string, primaryOnly: boolean) {
  const forms = singular(token) === token ? [token] : [token, singular(token)];
  let best = 0;
  for (const f of entry.fields) {
    if (primaryOnly && f.weight < PRIMARY_WEIGHT) continue;
    for (const form of forms) {
      if (f.words.some((word) => word === form)) best = Math.max(best, f.weight * 1.5);
      else if (f.words.some((word) => word.startsWith(form))) best = Math.max(best, f.weight);
      else if (form.length >= 3 && f.text.includes(form)) best = Math.max(best, f.weight * 0.5);
    }
  }
  return best;
}

function relevance(entry: Indexed, tokens: string[], compactQuery: string, primaryOnly: boolean) {
  let score = 0;
  for (const token of tokens) {
    const s = tokenScore(entry, token, primaryOnly);
    if (s === 0) return 0;
    score += s;
  }
  if (compactQuery && entry.skus.some((sku) => normalizeText(sku).replace(/ /g, "") === compactQuery)) score += 50;
  if (entry.titleText === tokens.join(" ")) score += 30;
  else if (entry.titleText.startsWith(tokens.join(" "))) score += 10;
  return score;
}

function distance(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

// Fixes misspelt tokens against words that really exist in the catalogue.
function correctTokens(entries: Indexed[], tokens: string[]) {
  const vocabulary = new Set<string>();
  for (const entry of entries) for (const f of entry.fields.slice(0, 4)) f.words.forEach((word) => word.length >= 3 && vocabulary.add(word));
  let changed = false;
  const corrected = tokens.map((token) => {
    if (token.length < 4 || [...vocabulary].some((word) => word.startsWith(token) || word.startsWith(singular(token)))) return token;
    const limit = token.length >= 7 ? 2 : 1;
    let best = token;
    let bestDistance = limit + 1;
    for (const word of vocabulary) {
      const d = distance(token, word, limit);
      if (d < bestDistance) { best = word; bestDistance = d; }
    }
    if (best !== token) changed = true;
    return best;
  });
  return changed ? corrected : null;
}

export function toSearchItem(product: SearchableProduct): SearchItem {
  const stock = typeof product.stock === "number" ? product.stock : 10;
  const skus = productSkus(product);
  return {
    slug: product.slug,
    title: product.title,
    price: product.price,
    priceValue: parsePrice(product.price),
    tag: product.tag || "",
    category: product.category || "",
    origin: product.origin || product.location || "",
    stock,
    inStock: stock > 0,
    sku: skus[0] ?? null,
    sizeOptions: (product.sizeOptions || []).slice(0, 1).map((option) => ({ sku: option.sku })),
  };
}

function facetCounts(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function parseSearchParams(get: (key: string) => string | null | undefined): SearchParams {
  const num = (key: string) => {
    const value = Number(get(key));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
  };
  return {
    q: get("q"),
    category: get("category"),
    origin: get("origin"),
    sort: get("sort"),
    inStock: get("inStock") === "1",
    maxPrice: num("maxPrice"),
    page: num("page") ?? 1,
    pageSize: num("pageSize") ?? DEFAULT_PAGE_SIZE,
  };
}

export function searchCatalog(catalog: SearchableProduct[], params: SearchParams): SearchResult {
  const query = sanitizeQuery(params.q);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const sort: SearchSort = sorts.includes(params.sort as SearchSort) ? (params.sort as SearchSort) : "relevance";
  const entries = catalog.map(index);

  let tokens = tokenize(query);
  let correctedFrom: string | null = null;
  // Strong fields first; descriptive keywords ("hot", "citrusy") only when nothing is named that way.
  const rank = (list: string[]) => {
    const compact = list.join("");
    const strong = entries.map((entry, position) => ({ entry, position, score: relevance(entry, list, compact, true) })).filter((row) => row.score > 0);
    return strong.length ? strong : entries.map((entry, position) => ({ entry, position, score: relevance(entry, list, compact, false) })).filter((row) => row.score > 0);
  };
  let matches = tokens.length ? rank(tokens) : query ? [] : entries.map((entry, position) => ({ entry, position, score: 1 }));
  if (tokens.length && matches.length === 0) {
    const corrected = correctTokens(entries, tokens);
    if (corrected) {
      const rescored = rank(corrected);
      if (rescored.length) {
        correctedFrom = query;
        tokens = corrected;
        matches = rescored;
      }
    }
  }
  const scored = matches;

  const category = sanitizeQuery(params.category);
  const origin = sanitizeQuery(params.origin);
  const facetBase = scored;
  const filtered = scored.filter(({ entry }) => {
    const p = entry.product;
    if (category && (p.category || "") !== category) return false;
    if (origin && (p.origin || p.location || "") !== origin) return false;
    if (params.inStock && !((typeof p.stock === "number" ? p.stock : 10) > 0)) return false;
    if (params.maxPrice && parsePrice(p.price) > params.maxPrice) return false;
    return true;
  });

  const inStockRank = (row: (typeof filtered)[number]) => ((typeof row.entry.product.stock === "number" ? row.entry.product.stock : 10) > 0 ? 0 : 1);
  filtered.sort((a, b) => {
    if (sort === "price-low") return parsePrice(a.entry.product.price) - parsePrice(b.entry.product.price) || a.position - b.position;
    if (sort === "price-high") return parsePrice(b.entry.product.price) - parsePrice(a.entry.product.price) || a.position - b.position;
    if (sort === "name") return a.entry.product.title.localeCompare(b.entry.product.title);
    return inStockRank(a) - inStockRank(b) || b.score - a.score || a.position - b.position;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize).map((row) => toSearchItem(row.entry.product)),
    total,
    page,
    pageSize,
    totalPages,
    query,
    correctedFrom,
    correctedTo: correctedFrom ? tokens.join(" ") : null,
    sort,
    facets: {
      categories: facetCounts(facetBase.map((row) => row.entry.product.category || "")),
      origins: facetCounts(facetBase.map((row) => row.entry.product.origin || row.entry.product.location || "")),
    },
  };
}

// Category names whose words start with what the customer typed, for "browse this category" suggestions.
export function matchCategories(catalog: SearchableProduct[], query: string) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  return facetCounts(catalog.map((p) => p.category || "")).filter(({ name }) => {
    const words = normalizeText(name).split(" ");
    return tokens.every((token) => words.some((word) => word.startsWith(token) || word.startsWith(singular(token))));
  });
}
