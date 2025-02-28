import React from 'react';
import '../styles/OrderSummary.css';
import { useOrders } from '../contexts/OrdersContext';

function OrderSummary() {
  const { 
    currentOrder, 
    removeItem, 
    clearOrder, 
    completeOrder,
    applyTaxes,
    toggleTaxes
  } = useOrders();

  const { items, total, tps, tvq, totalWithTax } = currentOrder;

  return (
    <div className="order-summary">
      <h2>Current Order</h2>
      {items.length === 0 ? (
        <p className="empty-order">No items in order</p>
      ) : (
        <>
          <div className="order-items">
            {items.map((item) => (
              <div key={item.id} className="order-item">
                <div className="item-info">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <button
                  className="remove-item-btn"
                  onClick={() => removeItem(item.id)}
                >
                  -
                </button>
              </div>
            ))}
          </div>
          <div className="order-totals">
            <div className="total-line">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {/* Add tax toggle switch */}
            <div className="tax-toggle">
              <label>
                <input 
                  type="checkbox" 
                  checked={applyTaxes} 
                  onChange={toggleTaxes}
                />
                Add taxes (TPS 5% + TVQ 9.975%)
              </label>
            </div>
            {applyTaxes && (
              <>
                <div className="total-line">
                  <span>TPS (5%):</span>
                  <span>${tps.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>TVQ (9.975%):</span>
                  <span>${tvq.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="total-line total">
              <span>Total:</span>
              <span>${totalWithTax.toFixed(2)}</span>
            </div>
          </div>
          <div className="order-actions">
            <button 
              className="clear-btn" 
              onClick={clearOrder}
            >
              Clear Order
            </button>
            <button 
              className="complete-btn" 
              onClick={completeOrder}
            >
              Complete Order
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default OrderSummary;