import React, { useState } from 'react';
import CustomerInput from './CustomerInput';
import ConfirmDialog from './ConfirmDialog';
import { useOrders } from '../contexts/OrdersContext';
import '../styles/OrderSummary.css';

function OrderSummary() {
  const {
    currentOrder,
    removeItem,
    addItem,
    clearOrder,
    saveOrder,
    applyTaxes,
    toggleTaxes,
    updateCustomerName,
    updateNotes,
    updatePaymentMethod,
    saving,
    isOnline,
  } = useOrders();
  const [confirmClear, setConfirmClear] = useState(false);
  const { items, total, tps, tvq, totalWithTax } = currentOrder;

  return (
    <div className="order-summary" id="current-order">
      <div className="order-summary__heading">
        <div>
          <p className="section-label">
            {currentOrder.originalId ? 'Editing order' : 'Current order'}
          </p>
          <h2>
            {currentOrder.orderNumber
              ? `Order #${currentOrder.orderNumber}`
              : 'New order'}
          </h2>
        </div>
        <span className="item-count">
          {items.reduce((sum, item) => sum + item.quantity, 0)} items
        </span>
      </div>

      <CustomerInput
        customerName={currentOrder.customerName}
        notes={currentOrder.notes}
        paymentMethod={currentOrder.paymentMethod}
        updateCustomerName={updateCustomerName}
        updateNotes={updateNotes}
        updatePaymentMethod={updatePaymentMethod}
      />

      <div className="order-lines" aria-label="Items in current order">
        {items.length === 0 ? (
          <div className="empty-order">
            <strong>Your order is empty</strong>
            <p>Select a menu item to begin.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="order-item">
              <div className="order-item__copy">
                <strong>{item.name}</strong>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              <div className="quantity-control" aria-label={`${item.name} quantity`}>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove one ${item.name}`}
                >
                  −
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button
                  onClick={() => addItem(item)}
                  aria-label={`Add one ${item.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="tax-toggle">
        <div>
          <strong>Québec taxes</strong>
          <span>TPS 5% + TVQ 9.975%</span>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={applyTaxes}
            onChange={toggleTaxes}
          />
          <span aria-hidden="true" />
          <span className="sr-only">
            {applyTaxes ? 'Remove taxes' : 'Apply taxes'}
          </span>
        </label>
      </div>

      <dl className="order-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>${total.toFixed(2)}</dd>
        </div>
        {applyTaxes ? (
          <>
            <div>
              <dt>TPS</dt>
              <dd>${tps.toFixed(2)}</dd>
            </div>
            <div>
              <dt>TVQ</dt>
              <dd>${tvq.toFixed(2)}</dd>
            </div>
          </>
        ) : null}
        <div className="grand-total">
          <dt>Total</dt>
          <dd>${totalWithTax.toFixed(2)}</dd>
        </div>
      </dl>

      {confirmClear ? (
        <ConfirmDialog
          title="Clear this order?"
          message="The unfinished order will be removed from this device."
          confirmLabel="Clear order"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            clearOrder();
            setConfirmClear(false);
          }}
        />
      ) : null}

      <div className="order-actions">
        <button
          className="button button--quiet"
          onClick={() => setConfirmClear(true)}
          disabled={items.length === 0 || saving}
        >
          Clear
        </button>
        <button
          className="button button--primary"
          onClick={saveOrder}
          disabled={items.length === 0 || saving || !isOnline}
        >
          {saving
            ? 'Saving…'
            : currentOrder.originalId
              ? 'Update Order'
              : 'Save Order'}
        </button>
      </div>
      {!isOnline ? (
        <p className="offline-save-note">
          Reconnect to save. This draft remains on this device.
        </p>
      ) : null}
    </div>
  );
}

export default OrderSummary;
