export const STATUSES = ["new", "packed", "out_for_delivery", "completed"] as const;
export type OrderStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New Order",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
};
export const nextStatus = (s: OrderStatus): OrderStatus | null => STATUSES[STATUSES.indexOf(s) + 1] ?? null;
