import React from 'react';
import '../styles/Header.css';

function Header({
  showHistory,
  setShowHistory,
  isOnline,
  usingCachedData,
}) {
  const connectionText = isOnline
    ? usingCachedData
      ? 'Using cached data'
      : 'Connected'
    : 'Offline';

  return (
    <header className="header">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">TB</span>
        <div>
          <h1>TimBit Order System</h1>
          <p>Food truck service console</p>
        </div>
      </div>

      <div className="header-actions">
        <span
          className={`connection-state ${isOnline ? 'is-online' : 'is-offline'}`}
          role="status"
        >
          <span aria-hidden="true" />
          {connectionText}
        </span>
        <button
          className="history-toggle-btn"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'New Order' : 'Order History'}
        </button>
      </div>
    </header>
  );
}

export default Header;
