// Helper functions for order summary calculations

// Calculate daily summary (total amount, order count, items sold)
export const calculateDailySummary = (orders, startDate, endDate) => {
  console.log('Processing orders:', orders.length);
  console.log('Date filter:', { startDate, endDate });
  
  if (!orders || orders.length === 0) {
    console.log('No orders to process');
    return {
      summaryByDate: [],
      overallSummary: {
        totalAmount: 0,
        orderCount: 0,
        itemsSold: []
      }
    };
  }
  
  // Group orders by date
  const ordersByDate = {};
  const todayString = new Date().toLocaleDateString();
  
  // Get the current date as a string in YYYY-MM-DD format for comparison
  const today = new Date();
  const todayISODate = today.toISOString().split('T')[0];
  
  // Create a date to compare "Yesterday"
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISODate = yesterday.toISOString().split('T')[0];
  
  orders.forEach(order => {
    // Skip invalid orders
    if (!order) return;
    
    // Parse the date and create various formats for reliable matching
    let orderDate;
    let dateKey;
    let orderISODate;
    
    try {
      if (typeof order.timestamp === 'string') {
        // Handle format like "2/28/2025 at 1:47:42 PM"
        if (order.timestamp.includes('at')) {
          orderDate = new Date(order.timestamp);
        } else {
          // Handle ISO format like "2025-02-28T18:47:42.000Z"
          orderDate = new Date(order.timestamp);
        }
      } else if (order.timestamp && order.timestamp.seconds) {
        // Handle Firestore timestamp
        orderDate = new Date(order.timestamp.seconds * 1000);
      } else {
        // Fallback to current date if no timestamp
        orderDate = new Date();
      }
      
      // Create consistent dateKey using local date format
      dateKey = orderDate.toLocaleDateString();
      
      // Create ISO date for comparison (YYYY-MM-DD)
      orderISODate = orderDate.toISOString().split('T')[0];
      
      // Store the ISO date with each order for filtering
      order._isoDate = orderISODate;
      
      console.log(`Order ${order.id || 'unknown'} date: ${dateKey} (ISO: ${orderISODate})`);
    } catch (error) {
      console.error('Error parsing date:', error);
      dateKey = 'Unknown Date';
      order._isoDate = null;
    }
    
    // Initialize date group if needed
    if (!ordersByDate[dateKey]) {
      ordersByDate[dateKey] = {
        date: dateKey,
        isoDate: orderISODate,
        orders: [],
        totalAmount: 0,
        orderCount: 0,
        itemsSold: {}
      };
    }
    
    // Add order to its date group
    ordersByDate[dateKey].orders.push(order);
    ordersByDate[dateKey].orderCount += 1;
    
    // Calculate order total
    let orderTotal = 0;
    if (typeof order.totalWithTax === 'number') {
      orderTotal = order.totalWithTax;
    } else if (order.totalWithTax) {
      orderTotal = parseFloat(order.totalWithTax);
    } else {
      // Fallback to calculating from components
      const subtotal = parseFloat(order.total) || 0;
      const tps = parseFloat(order.tps) || 0;
      const tvq = parseFloat(order.tvq) || 0;
      orderTotal = subtotal + tps + tvq;
    }
    
    console.log(`Order ${order.id || 'unknown'} total: ${orderTotal}`);
    ordersByDate[dateKey].totalAmount += orderTotal;
    
    // Count items sold
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (!item) return;
        
        const itemId = item.id ? item.id.toString() : 'unknown';
        const itemName = item.name || `Item #${itemId}`;
        
        if (!ordersByDate[dateKey].itemsSold[itemId]) {
          ordersByDate[dateKey].itemsSold[itemId] = {
            id: itemId,
            name: itemName,
            quantity: 0,
            total: 0
          };
        }
        
        const quantity = parseInt(item.quantity) || 1;
        const price = parseFloat(item.price) || 0;
        const itemTotal = price * quantity;
        
        ordersByDate[dateKey].itemsSold[itemId].quantity += quantity;
        ordersByDate[dateKey].itemsSold[itemId].total += itemTotal;
      });
    }
  });
  
  // Convert ordersByDate to array
  let summaryByDate = Object.values(ordersByDate);
  
  // Convert itemsSold from object to array
  summaryByDate.forEach(day => {
    day.itemsSold = Object.values(day.itemsSold);
  });
  
  // Sort by date (newest first)
  summaryByDate.sort((a, b) => {
    // Use the ISO date for comparison if available
    if (a.isoDate && b.isoDate) {
      return b.isoDate.localeCompare(a.isoDate);
    }
    // Fallback to parsing the display date
    return new Date(b.date) - new Date(a.date);
  });
  
  // Filter by date range if provided
  let filteredSummary = summaryByDate;
  
  if (startDate && endDate) {
    console.log(`Filtering by date range: ${startDate} to ${endDate}`);
    
    // Special case for "Today"
    if (startDate === todayISODate && endDate === todayISODate) {
      console.log('Filtering for today:', todayISODate);
      
      // Look for orders where the date matches today's date
      const todayOrders = orders.filter(order => {
        // First try ISO date we stored
        if (order._isoDate === todayISODate) return true;
        
        // Then try matching by local date string
        try {
          const orderDate = parseOrderDate(order);
          return orderDate && orderDate.toLocaleDateString() === todayString;
        } catch (e) {
          return false;
        }
      });
      
      console.log('Today\'s orders found:', todayOrders.length);
      
      if (todayOrders.length > 0) {
        // Find the summary day that matches today
        filteredSummary = summaryByDate.filter(day => {
          return day.isoDate === todayISODate || day.date === todayString;
        });
      } else {
        filteredSummary = [];
      }
    }
    // Special case for "Yesterday"
    else if (startDate === yesterdayISODate && endDate === yesterdayISODate) {
      filteredSummary = summaryByDate.filter(day => {
        return day.isoDate === yesterdayISODate;
      });
    }
    // Normal date range filtering
    else {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filteredSummary = summaryByDate.filter(day => {
        // If we have ISO date stored with the summary, use that
        if (day.isoDate) {
          return day.isoDate >= startDate && day.isoDate <= endDate;
        }
        
        // Otherwise parse the display date
        try {
          const dayDate = new Date(day.date);
          return dayDate >= start && dayDate <= end;
        } catch (error) {
          console.error('Error filtering date:', error, day);
          return false;
        }
      });
    }
    
    console.log(`Filtered to ${filteredSummary.length} days in date range`);
  }
  
  // Calculate overall summary from the filtered days
  const overallSummary = {
    totalAmount: filteredSummary.reduce((sum, day) => sum + day.totalAmount, 0),
    orderCount: filteredSummary.reduce((sum, day) => sum + day.orderCount, 0),
    itemsSold: {}
  };
  
  // Aggregate items from filtered days
  filteredSummary.forEach(day => {
    day.itemsSold.forEach(item => {
      if (!overallSummary.itemsSold[item.id]) {
        overallSummary.itemsSold[item.id] = {
          id: item.id,
          name: item.name,
          quantity: 0,
          total: 0
        };
      }
      
      overallSummary.itemsSold[item.id].quantity += item.quantity;
      overallSummary.itemsSold[item.id].total += item.total;
    });
  });
  
  // Convert overall itemsSold to array and sort by quantity
  overallSummary.itemsSold = Object.values(overallSummary.itemsSold)
    .sort((a, b) => b.quantity - a.quantity);
  
  console.log('Final summary by date:', filteredSummary);
  console.log('Final overall summary:', overallSummary);
  
  return {
    summaryByDate: filteredSummary,
    overallSummary
  };
};

// Helper function to parse date from an order
function parseOrderDate(order) {
  try {
    if (typeof order.timestamp === 'string') {
      if (order.timestamp.includes('at')) {
        return new Date(order.timestamp);
      }
      return new Date(order.timestamp);
    } else if (order.timestamp && order.timestamp.seconds) {
      return new Date(order.timestamp.seconds * 1000);
    } else if (order.createdAt) {
      if (typeof order.createdAt === 'string') {
        return new Date(order.createdAt);
      }
      if (order.createdAt.seconds) {
        return new Date(order.createdAt.seconds * 1000);
      }
    }
    return null;
  } catch (error) {
    console.error('Error parsing order date:', error);
    return null;
  }
}

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount);
};

// Get date ranges (preset options)
export const getDateRanges = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const lastMonthStart = new Date(today);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  
  return {
    today: {
      label: 'Today',
      start: today.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    },
    yesterday: {
      label: 'Yesterday',
      start: yesterday.toISOString().split('T')[0],
      end: yesterday.toISOString().split('T')[0]
    },
    lastWeek: {
      label: 'Last 7 Days',
      start: lastWeekStart.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    },
    lastMonth: {
      label: 'Last 30 Days',
      start: lastMonthStart.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    },
    allTime: {
      label: 'All Time',
      start: null,
      end: null
    }
  };
};