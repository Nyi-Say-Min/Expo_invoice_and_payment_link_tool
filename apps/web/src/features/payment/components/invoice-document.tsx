import type { Order } from '../../../types/commerce'
import { money } from '../../../utils/format'

type Props = {
  order: Order
}

const invoiceDate = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function InvoiceDocument({ order }: Props) {
  const discountLabel = order.discountKind === 'volume'
    ? 'Volume discount (10%)'
    : order.discountKind === 'expo'
      ? 'Expo discount (10%)'
      : 'Discount'

  return (
    <article className="invoice-print" aria-label="Printable order invoice">
      <header className="invoice-header">
        <div>
          <span className="invoice-brand">TRUNOV HAIR</span>
          <p>Company address placeholder</p>
          <p>Registration / tax ID placeholder</p>
          <p>accounts@example.com</p>
        </div>
        <div className="invoice-title">
          <h1>INVOICE</h1>
          <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
          <span className={`invoice-status ${order.status}`}>
            {order.status}
          </span>
        </div>
      </header>

      <section className="invoice-meta">
        <div>
          <span>Bill to</span>
          <strong>{order.customerName}</strong>
          <p>{order.customerContact}</p>
        </div>
        <div>
          <span>Created</span>
          <strong>{invoiceDate.format(new Date(order.createdAt))}</strong>
          <p>Order ID: {order.id}</p>
        </div>
      </section>

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit USD</th>
            <th>Line USD</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={`${item.sku}-${item.blonde}-${index}`}>
              <td>
                <strong>{item.description}</strong>
                <span>
                  {item.sku}{item.blonde ? ' · Blonde shade +30%' : ''}
                </span>
              </td>
              <td>{item.quantity}</td>
              <td>{money(item.unitUsdCents / 100)}</td>
              <td>{money(item.lineUsdCents / 100)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="invoice-summary">
        <div><span>Subtotal</span><strong>{money(order.subtotalUsd)}</strong></div>
        <div>
          <span>{discountLabel}</span>
          <strong>−{money(order.discountUsd)}</strong>
        </div>
        <div className="invoice-total">
          <span>Total USD</span><strong>{money(order.totalUsd)}</strong>
        </div>
        <p>Reference CNY total: ¥{order.totalCny.toLocaleString()}</p>
      </section>

      <footer className="invoice-footer">
        <p>Thank you for your order.</p>
        <p>This invoice uses placeholder company details for the test assignment.</p>
      </footer>
    </article>
  )
}
