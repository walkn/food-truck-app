// Helper functions for order summary calculations

// Calculate daily summary (total amount, order count, items sold)
export const calculateDailySummary = (orders, startDate, endDate) => {
    // Filter orders by date range if provided
    let filteredOrders = orders;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.timestamp);
        return orderDate >= start && orderDate <= end;
      });
    }
    
    // Group orders by date
    const ordersByDate = {};
    
    filteredOrders.forEach(order => {
      const date = new Date(order.timestamp).toLocaleDateString();
      
      if (!ordersByDate[date]) {
        ordersByDate[date] = {
          date,
          orders: [],
          totalAmount: 0,
          orderCount: 0,
          itemsSold: {}
        };
      }
      
      ordersByDate[date].orders.push(order);
      ordersByDate[date].totalAmount += order.totalWithTax || 0;
      ordersByDate[date].orderCount += 1;
      
      // Count items sold
      order.items.forEach(item => {
        if (!ordersByDate[date].itemsSold[item.id]) {
          ordersByDate[date].itemsSold[item.id] = {
            id: item.id,
            name: item.name,
            quantity: 0,
            total: 0
          };
        }
        
        ordersByDate[date].itemsSold[item.id].quantity += item.quantity;
        ordersByDate[date].itemsSold[item.id].total += item.price * item.quantity;
      });
    });
    
    // Convert grouped data to array and sort by date (newest first)
    const summaryByDate = Object.values(ordersByDate).sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    // Convert itemsSold from object to array for each date
    summaryByDate.forEach(daySummary => {
      daySummary.itemsSold = Object.values(daySummary.itemsSold).sort((a, b) => {
        return b.quantity - a.quantity; // Sort by quantity, highest first
      });
    });
    
    // Calculate overall summary
    const overallSummary = {
      totalAmount: summaryByDate.reduce((sum, day) => sum + day.totalAmount, 0),
      orderCount: summaryByDate.reduce((sum, day) => sum + day.orderCount, 0),
      itemsSold: {}
    };
    
    // Aggregate items across all days
    summaryByDate.forEach(daySummary => {
      daySummary.itemsSold.forEach(item => {
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
    overallSummary.itemsSold = Object.values(overallSummary.itemsSold).sort((a, b) => {
      return b.quantity - a.quantity; // Sort by quantity, highest first
    });
    
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
  