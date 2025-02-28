import React from 'react';
import '../styles/OrderHistory.css';

function OrderHistory({ orderHistory, searchTerm, setSearchTerm, deleteOrder, editOrder, loading }) {
  // Format date from ISO string
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  if (loading) {
    return (
      <div className="order-history">
        <h2>Order History</h2>
        <div className="loading-indicator">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="order-history">
      <h2>Order History</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      {orderHistory.length === 0 ? (
        <p className="empty-history">No orders yet</p>
      ) : (
        <div className="history-list">
          {orderHistory.map((order) => (
            <div key={order.id} className="history-item">
              <div className="history-header">
                <span className="customer-name">
                  {order.customerName || 'Anonymous Customer'}
                </span>
                <span className="order-date">{formatDate(order.timestamp)}</span>
              </div>
              <div className="history-actions">
                <button 
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    editOrder(order.id);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Confirm before deleting
                    if (window.confirm('Are you sure you want to delete this order?')) {
                      deleteOrder(order.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
              <div className="history-items">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="history-item-detail">
                    <span>{item.name}</span>
                    <span>x{item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="history-totals">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>${order.total?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="total-line">
                  <span>TPS (5%):</span>
                  <span>${order.tps?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="total-line">
                  <span>TVQ (9.975%):</span>
                  <span>${order.tvq?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="total-line total">
                  <span>Total:</span>
                  <span>${order.totalWithTax?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;