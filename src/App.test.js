import { calculateTotals } from './utils/orderCalculations';
import { createOrdersCsv } from './utils/exportUtils';

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
