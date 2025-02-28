import React, { useState } from 'react';
import Header from './Header';
import MenuItems from './MenuItems';
import OrderSummary from './OrderSummary';
import OrderHistory from './OrderHistory';
import CustomerInput from './CustomerInput';
import { useOrders } from '../contexts/OrdersContext';
import '../styles/App.css';

function App() {
  const {
    currentOrder,
    orders,
    loading,
    addItem,
    removeItem,
    clearOrder,
    updateCustomerName,
    completeOrder,
    deleteOrder,
    editOrder,
    filterOrders,
  } = useOrders();

  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle Edit Order
  const handleEditOrder = (orderId) => {
    const result = editOrder(orderId);
    if (result.success) {
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
          orderHistory={filterOrders(searchTerm)} 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          deleteOrder={deleteOrder}
          editOrder={handleEditOrder}
          loading={loading}
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