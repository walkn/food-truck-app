import React from 'react';
import '../styles/CustomerInput.css';

function CustomerInput({ customerName, updateCustomerName }) {
  return (
    <div className="customer-input">
      <label htmlFor="customer-name">Customer Name:</label>
      <input
        type="text"
        id="customer-name"
        value={customerName}
        onChange={(e) => updateCustomerName(e.target.value)}
        placeholder="Enter customer name"
      />
    </div>
  );
}

export default CustomerInput;