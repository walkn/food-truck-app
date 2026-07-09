import React from 'react';
import '../styles/CustomerInput.css';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'mobile', label: 'Mobile pay' },
];

function CustomerInput({
  customerName,
  notes,
  paymentMethod,
  updateCustomerName,
  updateNotes,
  updatePaymentMethod,
}) {
  return (
    <div className="customer-fields">
      <div className="field">
        <label htmlFor="customer-name">Customer name</label>
        <input
          type="text"
          id="customer-name"
          value={customerName}
          maxLength={80}
          onChange={(event) => updateCustomerName(event.target.value)}
          placeholder="Optional"
          autoComplete="off"
        />
      </div>

      <div className="field">
        <div className="field-label-row">
          <label htmlFor="order-notes">Order notes</label>
          <span>{notes.length}/240</span>
        </div>
        <textarea
          id="order-notes"
          value={notes}
          maxLength={240}
          rows={2}
          onChange={(event) => updateNotes(event.target.value)}
          placeholder="Allergies, pickup details, special requests…"
        />
      </div>

      <fieldset className="payment-field">
        <legend>Payment method</legend>
        <div className="segmented-control">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.value}
              className={paymentMethod === method.value ? 'is-selected' : ''}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.value}
                checked={paymentMethod === method.value}
                onChange={(event) =>
                  updatePaymentMethod(event.target.value)
                }
              />
              <span>{method.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export default CustomerInput;
