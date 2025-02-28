import React from 'react';
import '../styles/Header.css';

function Header({ showHistory, setShowHistory }) {
  return (
    <header className="header">
      <h1>Food Truck Order System</h1>
      <button 
        className="history-toggle-btn"
        onClick={() => setShowHistory(!showHistory)}
      >
        {showHistory ? 'New Order' : 'Order History'}
      </button>
    </header>
  );
}

export default Header;