const escapeCsv = (value) => {
  const stringValue = String(value ?? '');
  return `"${stringValue.replaceAll('"', '""')}"`;
};

export function createOrdersCsv(orders) {
  const header = [
    'Order number',
    'Date',
    'Customer',
    'Status',
    'Payment method',
    'Items',
    'Subtotal',
    'TPS',
    'TVQ',
    'Total',
  ];

  const rows = orders.map((order) => [
    order.orderNumber || order.id,
    order.timestamp || '',
    order.customerName || 'Anonymous',
    order.status || 'new',
    order.paymentMethod || '',
    (order.items || [])
      .map((item) => `${item.name} x${item.quantity}`)
      .join('; '),
    Number(order.total || 0).toFixed(2),
    Number(order.tps || 0).toFixed(2),
    Number(order.tvq || 0).toFixed(2),
    Number(order.totalWithTax || 0).toFixed(2),
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');
}

export function downloadOrdersCsv(orders) {
  const blob = new Blob([createOrdersCsv(orders)], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `timbit-orders-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
