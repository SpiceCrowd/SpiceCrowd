"use client";

import { useCart } from "./CartProvider";
import type { AddToCartPayload } from "@/lib/cart";

export default function AddToCartButton({
  item,
  quantity = 1,
  disabled = false,
}: {
  item: AddToCartPayload;
  quantity?: number;
  disabled?: boolean;
}) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addItem({ ...item, quantity })}
      className="w-full rounded-full bg-[#0f4339] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,67,57,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123f36] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
    >
      Add to Cart
    </button>
  );
}
