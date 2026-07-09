import React, { useMemo, useState } from 'react';
import { useOrders } from '../contexts/OrdersContext';
import { downloadOrdersCsv } from '../utils/exportUtils';
import { formatCurrency, getDateRanges } from '../utils/orderSummaryUtils';
import '../styles/OrderSummaryReport.css';

function OrderSummaryReport() {
  const {
    orderSummary,
    dateFilter,
    updateDateFilter,
    orders,
  } = useOrders();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const dateRanges = useMemo(getDateRanges, []);
  const totalItems = orderSummary.overallSummary.itemsSold.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleDateRangeSelect = (key) => {
    const range = dateRanges[key];
    updateDateFilter(range.start, range.end);
    setCustomRange({
      start: range.start || '',
      end: range.end || '',
    });
  };

  return (
    <section className="order-summary-report" aria-labelledby="summary-title">
      <div className="summary-header">
        <div>
          <p className="section-label">Performance</p>
          <h2 id="summary-title">Sales Summary</h2>
        </div>
        <div className="summary-header__actions">
          <button
            className="button button--secondary"
            onClick={() => downloadOrdersCsv(orders)}
            disabled={orders.length === 0}
          >
            Export CSV
          </button>
          <button
            className="button button--quiet"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-expanded={isExpanded}
            aria-controls="report-details"
          >
            {isExpanded ? 'Hide details' : 'View details'}
          </button>
        </div>
      </div>

      <div className="overall-summary">
        <div>
          <span>Revenue</span>
          <strong>
            {formatCurrency(orderSummary.overallSummary.totalAmount)}
          </strong>
        </div>
        <div>
          <span>Orders</span>
          <strong>{orderSummary.overallSummary.orderCount}</strong>
        </div>
        <div>
          <span>Items sold</span>
          <strong>{totalItems}</strong>
        </div>
      </div>

      {isExpanded ? (
        <div id="report-details">
          <div className="date-filter">
            <div className="date-range-buttons" aria-label="Report date range">
              {Object.entries(dateRanges).map(([key, range]) => {
                const active =
                  dateFilter.startDate === range.start &&
                  dateFilter.endDate === range.end;
                return (
                  <button
                    key={key}
                    className={active ? 'active' : ''}
                    aria-pressed={active}
                    onClick={() => handleDateRangeSelect(key)}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>

            <div className="custom-range">
              <label>
                <span>Start date</span>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(event) =>
                    setCustomRange((range) => ({
                      ...range,
                      start: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>End date</span>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(event) =>
                    setCustomRange((range) => ({
                      ...range,
                      end: event.target.value,
                    }))
                  }
                />
              </label>
              <button
                className="button button--secondary"
                onClick={() =>
                  updateDateFilter(customRange.start, customRange.end)
                }
                disabled={!customRange.start || !customRange.end}
              >
                Apply dates
              </button>
            </div>
          </div>

          <div className="summary-tabs" role="tablist" aria-label="Report view">
            <button
              role="tab"
              aria-selected={activeTab === 'daily'}
              onClick={() => setActiveTab('daily')}
            >
              Daily breakdown
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'items'}
              onClick={() => setActiveTab('items')}
            >
              Items sold
            </button>
          </div>

          <div className="table-scroll" role="region" aria-label="Sales report" tabIndex="0">
            {activeTab === 'daily' ? (
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Items</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {orderSummary.summaryByDate.map((day) => (
                    <tr key={day.isoDate || day.date}>
                      <td>{day.date}</td>
                      <td>{day.orderCount}</td>
                      <td>
                        {day.itemsSold.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}
                      </td>
                      <td>{formatCurrency(day.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Share</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {orderSummary.overallSummary.itemsSold.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>
                        {totalItems
                          ? `${((item.quantity / totalItems) * 100).toFixed(1)}%`
                          : '0%'}
                      </td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {orderSummary.summaryByDate.length === 0 ? (
            <p className="empty-data">
              No completed sales were found in this date range.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default OrderSummaryReport;
