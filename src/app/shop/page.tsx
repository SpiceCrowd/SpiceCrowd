import { redirect } from "next/navigation";

export default async function ShopRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single) next.set(key, single);
  }
  redirect(`/products${next.toString() ? `?${next}` : ""}`);
}
