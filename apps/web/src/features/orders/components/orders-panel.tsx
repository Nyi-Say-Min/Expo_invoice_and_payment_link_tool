import type { Order, Pagination } from '../../../types/commerce'
import { money } from '../../../utils/format'

type Props = {
  orders: Order[]
  pagination: Pagination
  loading: boolean
  refreshingId: string
  paymentLoading: boolean
  exporting: boolean
  online: boolean
  onReload: () => void
  onRefresh: (orderId: string) => void
  onResume: (orderId: string) => void
  onExport: () => void
  onPageChange: (page: number) => void
}

const date = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function OrdersPanel({
  orders,
  pagination,
  loading,
  refreshingId,
  paymentLoading,
  exporting,
  online,
  onReload,
  onRefresh,
  onResume,
  onExport,
  onPageChange,
}: Props) {
  return (
    <main className="orders-panel">
      <div className="orders-heading">
        <div>
          <span className="eyebrow">ORDER HISTORY</span>
          <h2>Created orders</h2>
          <p>Review payments and export the day’s sales.</p>
        </div>
        <div className="orders-actions">
          <button
            className="quiet bordered"
            disabled={loading || !online}
            onClick={onReload}
          >
            {loading ? 'Loading…' : 'Reload'}
          </button>
          <button
            className="primary compact"
            disabled={exporting || !orders.length || !online}
            onClick={onExport}
          >
            {exporting ? 'Exporting…' : 'Export all CSV'}
          </button>
        </div>
      </div>

      {!orders.length && !loading ? (
        <div className="empty-orders">
          <h3>No orders yet</h3>
          <p>Completed order attempts will appear here.</p>
        </div>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Discount</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id}>
                  <td className="row-number">
                    {(pagination.page - 1) * pagination.pageSize + index + 1}
                  </td>
                  <td>
                    <strong>#{order.id.slice(0, 8)}</strong>
                    <small>{date.format(new Date(order.createdAt))}</small>
                  </td>
                  <td>
                    <strong>{order.customerName}</strong>
                    <small>{order.customerContact}</small>
                  </td>
                  <td>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    <small>{(order.totalWeightG / 1000).toFixed(2)} kg</small>
                  </td>
                  <td className="capitalize">{order.discountKind}</td>
                  <td>
                    <strong>{money(order.totalUsd)}</strong>
                    <small>¥{order.totalCny.toLocaleString()}</small>
                  </td>
                  <td>
                    <span className={`status ${order.status}`}>{order.status}</span>
                  </td>
                  <td>
                    {order.status === 'pending' && (
                      <div className="order-row-actions">
                        <button
                          className="resume-button"
                          disabled={paymentLoading || !online}
                          onClick={() => onResume(order.id)}
                        >
                          Resume payment
                        </button>
                        <button
                          className="text-button"
                          disabled={refreshingId === order.id || !online}
                          onClick={() => onRefresh(order.id)}
                        >
                          {refreshingId === order.id ? 'Checking…' : 'Check status'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination" aria-label="Order pages">
        <button
          className="quiet bordered"
          disabled={pagination.page <= 1 || loading}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Previous
        </button>
        <span>
          Page <strong>{pagination.page}</strong> of {pagination.totalPages}
          <small>{pagination.total} total orders</small>
        </span>
        <button
          className="quiet bordered"
          disabled={pagination.page >= pagination.totalPages || loading}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </main>
  )
}
