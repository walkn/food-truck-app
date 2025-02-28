import React from 'react';
import menuItems from '../data/menuItems';
import '../styles/MenuItems.css';

function MenuItems({ addItem }) {
  return (
    <div className="menu-items">
      <h2>Menu Items</h2>
      <div className="items-grid">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className="menu-item"
            onClick={() => addItem(item)}
          >
            <img src={item.image} alt={item.name} />
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>${item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuItems;
