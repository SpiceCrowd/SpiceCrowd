export function calculateOrderTotal(subtotal: number, discountAmount = 0, gstin?: string | null, delivery = 50, configuredTaxRate?: number) {
  const discount = Math.min(Math.max(0, Math.round(discountAmount)), Math.max(0, subtotal));
  const taxRate = gstin ? (typeof configuredTaxRate === "number" && configuredTaxRate >= 0 ? configuredTaxRate : 18) : 0;
  const tax = Math.round(((subtotal - discount) * taxRate) / 100);
  const total = subtotal - discount + delivery + tax;
  return { subtotal, discount, tax, delivery, total };
}
