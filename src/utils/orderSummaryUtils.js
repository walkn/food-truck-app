// Helper functions for order summary calculations

// Calculate daily summary (total amount, order count, items sold)
export const calculateDailySummary = (orders, startDate, endDate) => {
  // Log all orders for debugging
  console.log('All orders:', orders);
  
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
  
  orders.forEach(order => {
    console.log('Processing order:', order);
    
    // Skip invalid orders
    if (!order) return;
    
    // Generate a date key for grouping - use local date format
    let dateKey;
    try {
      if (typeof order.timestamp === 'string') {
        // Try to extract the date part from formats like "2/28/2025 at 1:47:42 PM"
        if (order.timestamp.includes('at')) {
          const datePart = order.timestamp.split('at')[0].trim();
          dateKey = new Date(datePart).toLocaleDateString();
        } else {
          // For ISO strings like "2025-02-28T18:47:42.000Z"
          dateKey = new Date(order.timestamp).toLocaleDateString();
        }
      } else {
        // Fallback to current date if no timestamp
        dateKey = new Date().toLocaleDateString();
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      dateKey = 'Unknown Date';
    }
    
    console.log(`Order date key: ${dateKey}`);
    
    // Initialize date group if needed
    if (!ordersByDate[dateKey]) {
      ordersByDate[dateKey] = {
        date: dateKey,
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
    
    console.log(`Order ${order.id} total: ${orderTotal}`);
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
  
  // Convert ordersByDate to array and sort by date (newest first)
  let summaryByDate = Object.values(ordersByDate);
  
  // Convert items sold from object to array
  summaryByDate.forEach(day => {
    day.itemsSold = Object.values(day.itemsSold);
  });
  
  // Sort by date if possible
  try {
    summaryByDate.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  } catch (error) {
    console.error('Error sorting by date:', error);
  }
  
  // Calculate overall summary
  const overallSummary = {
    totalAmount: summaryByDate.reduce((sum, day) => sum + day.totalAmount, 0),
    orderCount: summaryByDate.reduce((sum, day) => sum + day.orderCount, 0),
    itemsSold: {}
  };
  
  // Aggregate items across all days
  summaryByDate.forEach(day => {
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
  
  // Convert overall itemsSold to array
  overallSummary.itemsSold = Object.values(overallSummary.itemsSold);
  
  // Filter by date range if provided (after all calculations are done)
  if (startDate && endDate) {
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      summaryByDate = summaryByDate.filter(day => {
        try {
          const dayDate = new Date(day.date);
          return dayDate >= start && dayDate <= end;
        } catch (error) {
          console.error('Error filtering date:', error, day);
          return false;
        }
      });
      
      // Recalculate overall totals if filtered
      if (summaryByDate.length > 0) {
        overallSummary.totalAmount = summaryByDate.reduce((sum, day) => sum + day.totalAmount, 0);
        overallSummary.orderCount = summaryByDate.reduce((sum, day) => sum + day.orderCount, 0);
        
        // Reset itemsSold
        overallSummary.itemsSold = {};
        
        // Reaggregate items
        summaryByDate.forEach(day => {
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
        
        // Convert overall itemsSold to array again
        overallSummary.itemsSold = Object.values(overallSummary.itemsSold);
      }
    } catch (error) {
      console.error('Error in date filtering:', error);
    }
  }
  
  // Sort items by quantity
  overallSummary.itemsSold.sort((a, b) => b.quantity - a.quantity);
  
  console.log('Final summary by date:', summaryByDate);
  console.log('Final overall summary:', overallSummary);
  
  return {
    summaryByDate,
    overallSummary
  };
};

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