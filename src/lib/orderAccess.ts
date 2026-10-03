export type OrderAccessRecord = {
  userId?: string | null;
  email?: string | null;
};

export function canViewOrder(
  order: OrderAccessRecord,
  userId: string | null,
  userEmail: string | null,
  guestEmail: string | null,
  admin: boolean,
) {
  if (admin) return true;

  const orderUserId = order.userId ? String(order.userId) : null;
  const orderEmail = typeof order.email === "string" ? order.email.trim().toLowerCase() : null;
  return Boolean(
    (userId && orderUserId && orderUserId === String(userId)) ||
    (userEmail && orderEmail && orderEmail === userEmail.trim().toLowerCase()) ||
    (guestEmail && orderEmail && orderEmail === guestEmail.trim().toLowerCase()),
  );
}