import React, { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { useOrders } from '../contexts/OrdersContext';
import { formatCurrency } from '../utils/orderSummaryUtils';
import '../styles/OrderHistory.css';

const STATUS_OPTIONS = [
  ['new', 'New'],
  ['preparing', 'Preparing'],
  ['ready', 'Ready'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
];

function OrderHistory({ onEdit }) {
  const {
    filterOrders,
    orders,
    deletedOrders,
    deleteOrder,
    deleteAllOrders,
    restoreOrder,
    editOrder,
    updateOrderStatus,
    updateItemDeliveryStatus,
    loading,
  } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [printOrderId, setPrintOrderId] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const visibleOrders = useMemo(() => {
    const filtered = filterOrders(searchTerm);
    return statusFilter === 'active'
      ? filtered.filter(
          (order) => !['delivered', 'cancelled'].includes(order.status)
        )
      : statusFilter === 'all'
        ? filtered
        : filtered.filter((order) => order.status === statusFilter);
  }, [filterOrders, searchTerm, statusFilter]);

  useEffect(() => {
    if (!printOrderId) return;
    const handleAfterPrint = () => setPrintOrderId(null);
    window.addEventListener('afterprint', handleAfterPrint, { once: true });
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printOrderId]);

  const formatDate = (value) =>
    new Intl.DateTimeFormat('en-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));

  const handleEdit = (orderId) => {
    const result = editOrder(orderId);
    if (result.success) onEdit?.();
  };

  const handleDeleteAll = async () => {
    if (deletingAll) return;
    setDeletingAll(true);
    const result = await deleteAllOrders();
    setDeletingAll(false);
    if (result.success) setConfirmDeleteAll(false);
  };

  if (loading) {
    return (
      <section className="order-history">
        <h2>Order History</h2>
        <p className="loading-state" role="status">Loading orders…</p>
      </section>
    );
  }

  return (
    <section className="order-history" aria-labelledby="history-title">
      <div className="history-heading">
        <div>
          <h2 id="history-title">Order History</h2>
          <p>Track preparation, delivery, and completed sales.</p>
        </div>
        <button
          className="button button--danger-quiet no-print"
          onClick={() => setConfirmDeleteAll(true)}
          disabled={orders.length === 0 || deletingAll}
        >
          Delete all orders
        </button>
      </div>

      {confirmDeleteAll ? (
        <div className="bulk-delete-confirm no-print">
          <ConfirmDialog
            title="Delete all active orders?"
            message={`This will move ${orders.length} active orders to Recently Deleted. You can restore them later.`}
            confirmLabel={deletingAll ? 'Deleting…' : 'Delete all'}
            onCancel={() => setConfirmDeleteAll(false)}
            onConfirm={handleDeleteAll}
          />
        </div>
      ) : null}

      <div className="history-toolbar">
        <label className="search-field">
          <span className="sr-only">Search orders</span>
          <input
            type="search"
            placeholder="Search order number, customer, or item"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <label className="status-filter">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="active">Active orders</option>
            <option value="all">All orders</option>
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="empty-history">
          <strong>No matching orders</strong>
          <p>Try another search or status filter.</p>
        </div>
      ) : (
        <div className="history-list">
          {visibleOrders.map((order) => {
            const status = order.status || (order.completed ? 'delivered' : 'new');
            const deliveredCount = order.items?.filter((item) => item.delivered).length || 0;
            const itemCount = order.items?.length || 0;
            const progress = itemCount ? (deliveredCount / itemCount) * 100 : 0;

            return (
              <article
                key={order.id}
                className={`history-item status-${status} ${
                  printOrderId === order.id ? 'is-printing' : ''
                }`}
              >
                <div className="history-header">
                  <div>
                    <p className="order-number">
                      Order #{order.orderNumber || order.id.slice(0, 6)}
                    </p>
                    <h3>{order.customerName || 'Anonymous customer'}</h3>
                    <time dateTime={order.timestamp}>{formatDate(order.timestamp)}</time>
                  </div>
                  <label className="order-status-control">
                    <span className="sr-only">Order status</span>
                    <select
                      value={status}
                      onChange={(event) =>
                        updateOrderStatus(order.id, event.target.value)
                      }
                      className={`status-select status-select--${status}`}
                    >
                      {STATUS_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {order.notes ? <p className="order-notes">{order.notes}</p> : null}

                <div
                  className="delivery-progress"
                  aria-label={`${Math.round(progress)}% of items delivered`}
                >
                  <span style={{ transform: `scaleX(${progress / 100})` }} />
                </div>

                <div className="history-items">
                  {order.items?.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="history-item-detail">
                      <label className="delivery-check">
                        <input
                          type="checkbox"
                          checked={Boolean(item.delivered)}
                          onChange={(event) =>
                            updateItemDeliveryStatus(
                              order.id,
                              index,
                              event.target.checked
                            )
                          }
                        />
                        <span className={item.delivered ? 'is-delivered' : ''}>
                          {item.name}
                        </span>
                      </label>
                      <span>×{item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="history-footer">
                  <div className="history-meta">
                    <span>{order.paymentMethod || 'Payment not recorded'}</span>
                    <strong>{formatCurrency(order.totalWithTax || 0)}</strong>
                  </div>
                  <div className="history-actions no-print">
                    <button className="button button--quiet" onClick={() => setPrintOrderId(order.id)}>
                      Print
                    </button>
                    <button className="button button--quiet" onClick={() => handleEdit(order.id)}>
                      Edit
                    </button>
                    <button className="button button--danger-quiet" onClick={() => setDeleteTarget(order)}>
                      Delete
                    </button>
                  </div>
                </div>

                {deleteTarget?.id === order.id ? (
                  <div className="no-print">
                    <ConfirmDialog
                      title={`Delete order #${order.orderNumber || ''}?`}
                      message="You can restore it later from Recently Deleted."
                      confirmLabel="Move to deleted"
                      onCancel={() => setDeleteTarget(null)}
                      onConfirm={async () => {
                        await deleteOrder(order.id);
                        setDeleteTarget(null);
                      }}
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <section className="deleted-orders no-print">
        <button
          className="deleted-orders__toggle"
          onClick={() => setShowDeleted((visible) => !visible)}
          aria-expanded={showDeleted}
        >
          Recently Deleted ({deletedOrders.length})
          <span aria-hidden="true">{showDeleted ? '−' : '+'}</span>
        </button>
        {showDeleted ? (
          deletedOrders.length ? (
            <div className="deleted-orders__list">
              {deletedOrders.map((order) => (
                <div key={order.id}>
                  <span>
                    Order #{order.orderNumber || order.id.slice(0, 6)} ·{' '}
                    {order.customerName || 'Anonymous'}
                  </span>
                  <button
                    className="button button--secondary"
                    onClick={() => restoreOrder(order.id)}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>Deleted orders will appear here for recovery.</p>
          )
        ) : null}
      </section>
    </section>
  );
}

export default OrderHistory;
