const toLocalIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseOrderDate = (order) => {
  if (order.createdAt?.toDate) return order.createdAt.toDate();
  if (order.createdAt?.seconds) {
    return new Date(order.createdAt.seconds * 1000);
  }
  const parsed = new Date(order.timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const calculateDailySummary = (orders, startDate, endDate) => {
  const days = new Map();

  for (const order of orders || []) {
    const orderDate = parseOrderDate(order);
    if (!orderDate) continue;
    const isoDate = toLocalIsoDate(orderDate);
    if (startDate && isoDate < startDate) continue;
    if (endDate && isoDate > endDate) continue;

    if (!days.has(isoDate)) {
      days.set(isoDate, {
        date: orderDate.toLocaleDateString(),
        isoDate,
        totalAmount: 0,
        orderCount: 0,
        itemsSold: new Map(),
      });
    }

    const day = days.get(isoDate);
    day.totalAmount += Number(order.totalWithTax) || 0;
    day.orderCount += 1;

    for (const item of order.items || []) {
      const itemKey = String(item.id);
      const existing = day.itemsSold.get(itemKey) || {
        id: itemKey,
        name: item.name || `Item #${itemKey}`,
        quantity: 0,
        total: 0,
      };
      existing.quantity += Number(item.quantity) || 1;
      existing.total +=
        (Number(item.price) || 0) * (Number(item.quantity) || 1);
      day.itemsSold.set(itemKey, existing);
    }
  }

  const summaryByDate = [...days.values()]
    .map((day) => ({
      ...day,
      totalAmount: Number(day.totalAmount.toFixed(2)),
      itemsSold: [...day.itemsSold.values()],
    }))
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));

  const overallItems = new Map();
  for (const day of summaryByDate) {
    for (const item of day.itemsSold) {
      const existing = overallItems.get(item.id) || {
        id: item.id,
        name: item.name,
        quantity: 0,
        total: 0,
      };
      existing.quantity += item.quantity;
      existing.total += item.total;
      overallItems.set(item.id, existing);
    }
  }

  return {
    summaryByDate,
    overallSummary: {
      totalAmount: Number(
        summaryByDate
          .reduce((sum, day) => sum + day.totalAmount, 0)
          .toFixed(2)
      ),
      orderCount: summaryByDate.reduce(
        (sum, day) => sum + day.orderCount,
        0
      ),
      itemsSold: [...overallItems.values()].sort(
        (a, b) => b.quantity - a.quantity
      ),
    },
  };
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(amount) || 0);

export const getDateRanges = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - 6);
  const lastMonthStart = new Date(today);
  lastMonthStart.setDate(today.getDate() - 29);

  return {
    today: {
      label: 'Today',
      start: toLocalIsoDate(today),
      end: toLocalIsoDate(today),
    },
    yesterday: {
      label: 'Yesterday',
      start: toLocalIsoDate(yesterday),
      end: toLocalIsoDate(yesterday),
    },
    lastWeek: {
      label: 'Last 7 days',
      start: toLocalIsoDate(lastWeekStart),
      end: toLocalIsoDate(today),
    },
    lastMonth: {
      label: 'Last 30 days',
      start: toLocalIsoDate(lastMonthStart),
      end: toLocalIsoDate(today),
    },
    allTime: {
      label: 'All time',
      start: null,
      end: null,
    },
  };
};
