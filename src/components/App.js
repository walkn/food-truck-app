import React, { useRef, useState } from 'react';
import Header from './Header';
import MenuItems from './MenuItems';
import OrderSummary from './OrderSummary';
import OrderHistory from './OrderHistory';
import { useOrders } from '../contexts/OrdersContext';
import '../styles/App.css';
import OrderSummaryReport from './OrderSummaryReport';

function App() {
  const {
    currentOrder,
    error,
    notice,
    isOnline,
    usingCachedData,
    dismissError,
    dismissNotice,
  } = useOrders();
  const [showHistory, setShowHistory] = useState(false);
  const orderRailRef = useRef(null);

  const itemCount = currentOrder.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="app">
      <Header
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        isOnline={isOnline}
        usingCachedData={usingCachedData}
      />

      <div className="feedback-stack" aria-live="polite">
        {error ? (
          <div className="feedback feedback--error" role="alert">
            <span>{error}</span>
            <button onClick={dismissError} aria-label="Dismiss error">×</button>
          </div>
        ) : null}
        {notice ? (
          <div className="feedback feedback--success" role="status">
            <span>{notice}</span>
            <button onClick={dismissNotice} aria-label="Dismiss message">×</button>
          </div>
        ) : null}
      </div>

      <main>
        {showHistory ? (
          <div className="history-view">
            <OrderSummaryReport />
            <OrderHistory onEdit={() => setShowHistory(false)} />
          </div>
        ) : (
          <div className="order-container">
            <section className="menu-container" aria-labelledby="menu-heading">
              <MenuItems />
            </section>
            <aside className="order-summary-container" ref={orderRailRef}>
              <OrderSummary />
            </aside>
          </div>
        )}
      </main>

      {!showHistory ? (
        <button
          className="mobile-order-bar"
          onClick={() =>
            orderRailRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }
          aria-label={`View current order with ${itemCount} items, total ${currentOrder.totalWithTax.toFixed(2)} dollars`}
        >
          <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          <strong>Current order · ${currentOrder.totalWithTax.toFixed(2)}</strong>
        </button>
      ) : null}
    </div>
  );
}

export default App;
