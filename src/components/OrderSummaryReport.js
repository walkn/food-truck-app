import React, { useState } from 'react';
import { useOrders } from '../contexts/OrdersContext';
import { formatCurrency, getDateRanges } from '../utils/orderSummaryUtils';
import '../styles/OrderSummaryReport.css';

function OrderSummaryReport() {
  const { 
    orderSummary, 
    dateFilter, 
    updateDateFilter, 
    orders // Add this to get access to the raw orders
  } = useOrders();
  
  // Add this debugging section
  console.log('Raw orders:', orders);
  console.log('Date filter:', dateFilter);
  console.log('Order summary:', orderSummary);
  
  // Check if there are orders but summaries are empty
  if (orders && orders.length > 0 && orderSummary.summaryByDate.length === 0) {
    console.log('Orders exist but summary is empty - possible format issue with:', 
      orders.map(order => ({
        id: order.id,
        timestamp: order.timestamp,
        totalWithTax: order.totalWithTax,
        items: order.items
      }))
    );
  }

  const [activeTab, setActiveTab] = useState('daily');
  const dateRanges = getDateRanges();
  const [customRange, setCustomRange] = useState({
    start: '',
    end: ''
  });
  
  // Handle date range selection
  const handleDateRangeSelect = (range) => {
    if (range === 'custom') {
      updateDateFilter(customRange.start, customRange.end);
    } else {
      const selectedRange = dateRanges[range];
      updateDateFilter(selectedRange.start, selectedRange.end);
      
      // Update custom range inputs to match
      setCustomRange({
        start: selectedRange.start || '',
        end: selectedRange.end || ''
      });
    }
  };
  
  // Handle custom date input change
  const handleCustomDateChange = (e) => {
    const { name, value } = e.target;
    setCustomRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply custom date range
  const applyCustomRange = () => {
    updateDateFilter(customRange.start, customRange.end);
  };
  
  // Format percentage
  const formatPercent = (value, total) => {
    if (!total) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  return (
    <div className="order-summary-report">
      <h2>Sales Summary</h2>
      
      {/* Date Range Filter */}
      <div className="date-filter">
        <h3>Date Range</h3>
        <div className="date-range-buttons">
          {Object.keys(dateRanges).map(key => (
            <button 
              key={key}
              className={!dateFilter.startDate && !dateFilter.endDate && key === 'allTime' ? 'active' : 
                       (dateFilter.startDate === dateRanges[key].start && 
                        dateFilter.endDate === dateRanges[key].end) ? 'active' : ''}
              onClick={() => handleDateRangeSelect(key)}
            >
              {dateRanges[key].label}
            </button>
          ))}

            <button 
                className="force-all-orders"
                onClick={() => {
                  // Force a refresh with all orders
                  updateDateFilter(null, null);
                  console.log("Forcing display of all orders");
                }}
              >
                Show All Orders
              </button>
        </div>
        
        <div className="custom-range">
          <div className="date-inputs">
            <div className="date-input-group">
              <label>Start Date:</label>
              <input 
                type="date" 
                name="start"
                value={customRange.start} 
                onChange={handleCustomDateChange}
              />
            </div>
            <div className="date-input-group">
              <label>End Date:</label>
              <input 
                type="date" 
                name="end"
                value={customRange.end} 
                onChange={handleCustomDateChange}
              />
            </div>
          </div>
          <button onClick={applyCustomRange}>Apply Custom Range</button>
        </div>
      </div>
      
      {/* Summary Tabs */}
      <div className="summary-tabs">
        <button 
          className={activeTab === 'daily' ? 'active' : ''}
          onClick={() => setActiveTab('daily')}
        >
          Daily Breakdown
        </button>
        <button 
          className={activeTab === 'items' ? 'active' : ''}
          onClick={() => setActiveTab('items')}
        >
          Items Sold
        </button>
      </div>
      
      {/* Overall Summary */}
      <div className="overall-summary">
        <div className="summary-card">
          <h3>Total Revenue</h3>
          <p className="summary-value">{formatCurrency(orderSummary.overallSummary.totalAmount)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Orders</h3>
          <p className="summary-value">{orderSummary.overallSummary.orderCount}</p>
        </div>
        <div className="summary-card">
          <h3>Total Items Sold</h3>
          <p className="summary-value">
            {orderSummary.overallSummary.itemsSold.reduce((sum, item) => sum + item.quantity, 0)}
          </p>
        </div>
      </div>
      
      {/* Daily Breakdown Tab */}
      {activeTab === 'daily' && (
  <div className="daily-breakdown">
    <h3>Daily Breakdown</h3>
    
    {orderSummary.summaryByDate.length === 0 ? (
      <div className="empty-data">
        <p>No orders found for selected date range</p>
        <button 
          onClick={() => updateDateFilter(null, null)}
          className="show-all-btn"
        >
          Show All Orders
        </button>
      </div>
    ) : (
      <table className="summary-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Orders</th>
            <th>Items Sold</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {orderSummary.summaryByDate.map((day, index) => (
            <tr key={index}>
              <td>{day.date}</td>
              <td>{day.orderCount}</td>
              <td>
                {day.itemsSold.reduce((sum, item) => sum + item.quantity, 0)}
              </td>
              <td>{formatCurrency(day.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
      
      {/* Items Sold Tab */}
      {activeTab === 'items' && (
        <div className="items-sold">
          <h3>Items Sold</h3>
          
          {orderSummary.overallSummary.itemsSold.length === 0 ? (
            <p className="empty-data">No items sold for selected date range</p>
          ) : (
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>% of Sales</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {orderSummary.overallSummary.itemsSold.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {formatPercent(
                        item.quantity, 
                        orderSummary.overallSummary.itemsSold.reduce((sum, i) => sum + i.quantity, 0)
                      )}
                    </td>
                    <td>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default OrderSummaryReport;