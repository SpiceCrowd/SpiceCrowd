export const POS_HELD_KEY = 'spicecrowd_pos_held_bills_v1';

export type HeldBill = { id: string; label: string; bill: { slug: string; title: string; qty: number; price: number }[]; createdAt: string };

export function readHeldBills(): HeldBill[] {
  try {
    const raw = localStorage.getItem(POS_HELD_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HeldBill[];
  } catch {
    return [];
  }
}

export function writeHeldBills(items: HeldBill[]) {
  try {
    localStorage.setItem(POS_HELD_KEY, JSON.stringify(items));
  } catch {}
}

export function addHeldBill(label: string, bill: HeldBill['bill']) {
  const items = readHeldBills();
  const id = `held_${Date.now()}`;
  items.unshift({ id, label, bill, createdAt: new Date().toISOString() });
  writeHeldBills(items);
  return id;
}

export function removeHeldBill(id: string) {
  const items = readHeldBills().filter((i) => i.id !== id);
  writeHeldBills(items);
}
