// Shared (client + server) order status definitions.
export const ORDER_FLOW = ['NEW', 'CONFIRMED', 'PACKED', 'READY', 'COMPLETED'] as const;
export const ORDER_STATUSES = [...ORDER_FLOW, 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  NEW: 'New',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  READY: 'Ready / On the way',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function customerStatusLabel(status: string, method: string) {
  if (status === 'READY') return method === 'DELIVERY' ? 'Out for delivery' : 'Ready for pickup';
  if (status === 'COMPLETED') return method === 'DELIVERY' ? 'Delivered' : 'Picked up';
  return STATUS_LABEL[status] || status;
}

export function nextStatus(status: string): OrderStatus | null {
  const i = ORDER_FLOW.indexOf(status as any);
  return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : null;
}


