import React from 'react';
import '../styles/OrderHistory.css';
import { useOrders } from '../contexts/OrdersContext';

function OrderHistory({ orderHistory, searchTerm, setSearchTerm, deleteOrder, editOrder, loading }) {
  // Get access to the updateItemDeliveryStatus function
  const { updateItemDeliveryStatus } = useOrders();
  
  // Format date from ISO string
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  // Handle checkbox changes
  const handleDeliveryStatusChange = async (orderId, itemIndex, isDelivered) => {
    await updateItemDeliveryStatus(orderId, itemIndex, isDelivered);
  };

  // Calculate delivery progress for an order
  const calculateDeliveryProgress = (items) => {
    if (!items || items.length === 0) return 0;
    
    const deliveredItems = items.filter(item => item.delivered).length;
    return (deliveredItems / items.length) * 100;
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
            <div key={order.id} className={`history-item ${order.completed ? 'completed-order' : ''}`}>
              <div className="history-header">
                <div>
                  <span className="customer-name">
                    {order.customerName || 'Anonymous Customer'}
                  </span>
                  <span className={`order-completion-status ${order.completed ? 'status-completed' : 'status-pending'}`}>
                    {order.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
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
              
              {/* Delivery progress bar */}
              <div className="delivery-progress">
                <div 
                  className="delivery-progress-bar" 
                  style={{ width: `${calculateDeliveryProgress(order.items)}%` }}
                ></div>
              </div>
              
              <div className="history-items">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="history-item-detail">
                    <div className="item-delivery-status">
                      <input
                        type="checkbox"
                        checked={item.delivered || false}
                        onChange={(e) => handleDeliveryStatusChange(order.id, index, e.target.checked)}
                        id={`item-${order.id}-${index}`}
                      />
                      <label 
                        htmlFor={`item-${order.id}-${index}`} 
                        className={item.delivered ? 'delivered' : ''}
                      >
                        {item.name}
                      </label>
                    </div>
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