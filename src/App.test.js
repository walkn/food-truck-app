import { calculateTotals } from './utils/orderCalculations';
import { createOrdersCsv } from './utils/exportUtils';
import { calculateDailySummary } from './utils/orderSummaryUtils';

describe('order calculations', () => {
  const items = [{ id: 1, name: 'Sugar Cane', price: 10, quantity: 2 }];

  test('calculates Québec TPS and TVQ separately from the subtotal', () => {
    expect(calculateTotals(items, true)).toEqual({
      total: 20,
      tps: 1,
      tvq: 2,
      totalWithTax: 23,
    });
  });

  test('returns the subtotal when taxes are disabled', () => {
    expect(calculateTotals(items, false)).toEqual({
      total: 20,
      tps: 0,
      tvq: 0,
      totalWithTax: 20,
    });
  });
});

test('exports order data as escaped CSV', () => {
  const csv = createOrdersCsv([
    {
      id: 'abc',
      orderNumber: 1001,
      timestamp: '2026-07-09T12:00:00.000Z',
      customerName: 'Doe, Jane',
      status: 'ready',
      paymentMethod: 'card',
      items: [{ name: 'Nem', quantity: 2 }],
      total: 10,
      tps: 0.5,
      tvq: 1,
      totalWithTax: 11.5,
    },
  ]);

  expect(csv).toContain('"Doe, Jane"');
  expect(csv).toContain('"Nem x2"');
  expect(csv).toContain('"11.50"');
});

describe('sales summary filters', () => {
  const orders = [
    {
      id: 'jan-2025',
      timestamp: '2025-01-15T12:00:00.000Z',
      totalWithTax: 10,
      items: [{ id: 1, name: 'Nuoc Mia', price: 10, quantity: 1 }],
    },
    {
      id: 'jan-2026',
      timestamp: '2026-01-15T12:00:00.000Z',
      totalWithTax: 20,
      items: [{ id: 1, name: 'Nuoc Mia', price: 10, quantity: 2 }],
    },
    {
      id: 'feb-2026',
      timestamp: '2026-02-15T12:00:00.000Z',
      totalWithTax: 30,
      items: [{ id: 2, name: 'Banh mi', price: 15, quantity: 2 }],
    },
  ];

  test('filters by year and month together', () => {
    const summary = calculateDailySummary(orders, null, null, '2026', '1');

    expect(summary.overallSummary.orderCount).toBe(1);
    expect(summary.overallSummary.totalAmount).toBe(20);
    expect(summary.overallSummary.itemsSold[0].quantity).toBe(2);
  });

  test('filters by month across all years', () => {
    const summary = calculateDailySummary(orders, null, null, 'all', '1');

    expect(summary.overallSummary.orderCount).toBe(2);
    expect(summary.overallSummary.totalAmount).toBe(30);
  });
});
