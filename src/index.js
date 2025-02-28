import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App';
import { OrdersProvider } from './contexts/OrdersContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <OrdersProvider>
      <App />
    </OrdersProvider>
  </React.StrictMode>
);