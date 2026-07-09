export const TPS_RATE = 0.05;
export const TVQ_RATE = 0.09975;

export function calculateTotals(items, applyTaxes) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );
  const tps = applyTaxes ? subtotal * TPS_RATE : 0;
  // Québec QST is calculated on the selling price, excluding GST.
  const tvq = applyTaxes ? subtotal * TVQ_RATE : 0;
  const totalWithTax = subtotal + tps + tvq;

  return {
    total: Number(subtotal.toFixed(2)),
    tps: Number(tps.toFixed(2)),
    tvq: Number(tvq.toFixed(2)),
    totalWithTax: Number(totalWithTax.toFixed(2)),
  };
}

export function normalizeOrder(order) {
  return {
    ...order,
    customerName: String(order.customerName || '').trim().slice(0, 80),
    notes: String(order.notes || '').trim().slice(0, 240),
    paymentMethod: order.paymentMethod || 'cash',
    status: order.status || (order.completed ? 'delivered' : 'new'),
    items: (order.items || []).map((item) => ({
      id: Number(item.id),
      name: String(item.name || '').slice(0, 80),
      price: Number(item.price),
      quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
      image: String(item.image || '').slice(0, 200),
      delivered: Boolean(item.delivered),
    })),
  };
}
