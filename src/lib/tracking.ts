export const trackingStatuses = [
  "order_confirmed",
  "packed",
  "dispatched",
  "in_transit",
  "local_hub",
  "out_for_delivery_or_collection",
  "delivered_or_collected",
  "delivery_failed",
  "returned_to_seller",
] as const;

export type TrackingStatus = typeof trackingStatuses[number];
export type DummyCourier = "ST Courier" | "MSS" | "India Post";

export const courierOptions: Array<{ name: DummyCourier; mode: string; estimate: string }> = [
  { name: "ST Courier", mode: "Home delivery", estimate: "2-5 business days in Tamil Nadu; 3-7 days where serviceable across India" },
  { name: "MSS", mode: "Near-office collection", estimate: "1-3 business days" },
  { name: "India Post", mode: "Home delivery for rural areas", estimate: "5-10 business days" },
];

export const trackingStatusLabels: Record<TrackingStatus, string> = {
  order_confirmed: "Order confirmed",
  packed: "Packed",
  dispatched: "Dispatched from Kolli Hills",
  in_transit: "In transit",
  local_hub: "Arrived at local hub",
  out_for_delivery_or_collection: "Out for delivery / Ready for collection",
  delivered_or_collected: "Delivered / Collected",
  delivery_failed: "Delivery failed",
  returned_to_seller: "Returned to seller",
};

export function createDummyTracking(orderId: string, courier: DummyCourier = "ST Courier") {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const courierCode = courier === "ST Courier" ? "ST" : courier === "MSS" ? "MSS" : "IP";
  const suffix = orderId.replace(/\D/g, "").slice(-4).padStart(4, "0");
  return {
    courier,
    courierMode: courierOptions.find((option) => option.name === courier)?.mode || "Home delivery",
    trackingNumber: `SC${date}${courierCode}-${suffix}`,
    status: "order_confirmed" as TrackingStatus,
    estimate: courierOptions.find((option) => option.name === courier)?.estimate || "Estimated delivery depends on destination pincode",
    pickupAddress: "No. 02/89, Solakkadu, Kolli Hills, Tamil Nadu 637415",
    collectionAddress: "",
    events: [{ status: "order_confirmed" as TrackingStatus, at: new Date().toISOString() }],
  };
}
