import type { Order } from '../db/schema.js'

function csvValue(value: unknown) {
  let text = String(value ?? '')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function exportOrdersCsv(orders: Order[]) {
  const header = [
    'date',
    'order_id',
    'customer',
    'contact',
    'items',
    'subtotal_usd',
    'discount_applied',
    'total_usd',
    'status',
  ]
  const rows = orders.map((order) => [
    order.createdAt.toISOString(),
    order.id,
    order.customerName,
    order.customerContact,
    order.items.map((item) =>
      `${item.quantity}x ${item.description}${item.blonde ? ' (blonde)' : ''}`,
    ).join('; '),
    (order.subtotalUsdCents / 100).toFixed(2),
    order.discountKind,
    (order.totalUsdCents / 100).toFixed(2),
    order.status,
  ].map(csvValue).join(','))
  return [header.join(','), ...rows].join('\r\n')
}
