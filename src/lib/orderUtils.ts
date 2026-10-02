export function calculateOrderTotal(subtotal: number, couponCode?: string, gstin?: string | null, delivery = 50, configuredTaxRate?: number) {
  const code = (couponCode || "").toString().toUpperCase();
  let discountPercent = 0;
  if (code === "SPICE10") discountPercent = 10;
  if (code === "FIRST20") discountPercent = 20;

  const discount = Math.round((subtotal * discountPercent) / 100);
  const taxRate = gstin ? (typeof configuredTaxRate === "number" && configuredTaxRate >= 0 ? configuredTaxRate : 18) : 0;
  const tax = Math.round(((subtotal - discount) * taxRate) / 100);
  const total = subtotal - discount + delivery + tax;
  return { subtotal, discount, tax, delivery, total, discountPercent };
}
