import React, { useEffect, useState } from 'react';
import { useOrders } from '../contexts/OrdersContext';
import '../styles/MenuItems.css';

function MenuItems() {
  const {
    menuItems,
    menuLoading,
    addItem,
    updateMenuItem,
  } = useOrders();
  const [showAdmin, setShowAdmin] = useState(false);
  const [draftItems, setDraftItems] = useState(menuItems);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    setDraftItems(menuItems);
  }, [menuItems]);

  const updateDraft = (id, changes) => {
    setDraftItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  };

  const saveItem = async (item) => {
    setSavingId(item.id);
    await updateMenuItem({
      ...item,
      price: Math.max(0, Number(item.price) || 0),
    });
    setSavingId(null);
  };

  return (
    <div className="menu-items">
      <div className="section-heading">
        <div>
          <h2 id="menu-heading">Menu</h2>
          <p>Select an item to add it to the current order.</p>
        </div>
        <button
          className="button button--quiet manage-menu-button"
          onClick={() => setShowAdmin((visible) => !visible)}
          aria-expanded={showAdmin}
          aria-controls="menu-admin"
        >
          {showAdmin ? 'Close menu editor' : 'Manage menu'}
        </button>
      </div>

      {showAdmin ? (
        <section className="menu-admin" id="menu-admin" aria-labelledby="menu-admin-title">
          <div className="menu-admin__heading">
            <h3 id="menu-admin-title">Menu availability and prices</h3>
            <p>Changes are shared with every connected device.</p>
          </div>
          <div className="menu-admin__rows">
            {draftItems.map((item) => (
              <div className="menu-admin__row" key={item.id}>
                <strong>{item.name}</strong>
                <label>
                  <span>Price</span>
                  <span className="price-input">
                    $
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="0.01"
                      value={item.price}
                      onChange={(event) =>
                        updateDraft(item.id, { price: event.target.value })
                      }
                    />
                  </span>
                </label>
                <label className="availability-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(item.soldOut)}
                    onChange={(event) =>
                      updateDraft(item.id, { soldOut: event.target.checked })
                    }
                  />
                  <span>Sold out</span>
                </label>
                <button
                  className="button button--secondary"
                  onClick={() => saveItem(item)}
                  disabled={savingId === item.id}
                >
                  {savingId === item.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {menuLoading ? (
        <p className="loading-state">Loading menu…</p>
      ) : (
        <div className="items-grid">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className="menu-item"
              onClick={() => addItem(item)}
              disabled={item.soldOut}
              aria-label={
                item.soldOut
                  ? `${item.name}, sold out`
                  : `Add ${item.name}, $${item.price.toFixed(2)}`
              }
            >
              <img src={item.image} alt="" loading="lazy" />
              <span className="item-details">
                <span className="item-copy">
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </span>
                <span className="item-command">
                  <strong>${Number(item.price).toFixed(2)}</strong>
                  <span>{item.soldOut ? 'Sold out' : 'Add item'}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MenuItems;
