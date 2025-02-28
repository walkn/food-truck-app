import React, { useState } from 'react';
import Header from './Header';
import MenuItems from './MenuItems';
import OrderSummary from './OrderSummary';
import OrderHistory from './OrderHistory';
import CustomerInput from './CustomerInput';
import useOrders from '../hooks/useOrders';
import '../styles/App.css';

function App() {
  const {
    currentOrder,
    orderHistory,
    addItem,
    removeItem,
    clearOrder,
    updateCustomerName,
    completeOrder,
    filterOrderHistory,
    deleteOrder,
    editOrder,
  } = useOrders();

  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Function to handle editing an order
  const handleEditOrder = (orderId) => {
    // If edit is successful, switch to order view
    if (editOrder(orderId)) {
      setShowHistory(false);
    }
  };

  return (
    <div className="app">
      <Header 
        showHistory={showHistory} 
        setShowHistory={setShowHistory} 
      />
      
      {showHistory ? (
        <OrderHistory 
          orderHistory={filterOrderHistory(searchTerm)} 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          deleteOrder={deleteOrder}
          editOrder={handleEditOrder}
        />
      ) : (
        <div className="order-container">
          <div className="order-summary-container">
            <CustomerInput 
              customerName={currentOrder.customerName} 
              updateCustomerName={updateCustomerName} 
            />
            <OrderSummary 
              order={currentOrder} 
              removeItem={removeItem} 
              clearOrder={clearOrder} 
              completeOrder={completeOrder} 
            />
          </div>
          <div className="menu-container">
            <MenuItems addItem={addItem} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;