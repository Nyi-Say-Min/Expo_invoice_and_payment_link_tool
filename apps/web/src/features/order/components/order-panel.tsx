import type { CartItem, Draft, Pricing, Product } from '../../../types/commerce'
import { money } from '../../../utils/format'

type Props = {
  draft: Draft
  products: Product[]
  pricing: Pricing | null
  onUpdateItem: (index: number, changes: Partial<CartItem>) => void
  onUpdateDetails: (changes: Partial<Draft>) => void
  onRemoveItem: (index: number) => void
  onClear: () => void
  onSubmit: () => void
  submitting: boolean
  online: boolean
}

export function OrderPanel({
  draft,
  products,
  pricing,
  onUpdateItem,
  onUpdateDetails,
  onRemoveItem,
  onClear,
  onSubmit,
  submitting,
  online,
}: Props) {
  const ready = Boolean(
    pricing &&
    draft.items.length &&
    draft.customerName.trim() &&
    draft.customerContact.trim() &&
    online,
  )
  const missingDetails: string[] = []
  if (!draft.customerName.trim()) missingDetails.push('customer name')
  if (!draft.customerContact.trim()) missingDetails.push('customer contact')
  const detailsError = draft.items.length && missingDetails.length
    ? `Required: ${missingDetails.join(' and ')}.`
    : ''

  return (
    <aside className="order-panel">
      <div className="section-heading">
        <div><span>02</span><h2>Current order</h2></div>
        {draft.items.length > 0 &&
          <button className="text-button" onClick={onClear}>Clear</button>}
      </div>
      {!draft.items.length ? (
        <div className="empty-cart">
          <div>0</div><h3>Your order is empty</h3>
          <p>Add regular or blonde items from the catalog.</p>
        </div>
      ) : (
        <div className="cart-list">
          {draft.items.map((item, index) => {
            const product = products.find((entry) => entry.sku === item.sku)
            const pricedItem = pricing?.items.find(
              (entry) => entry.sku === item.sku && entry.blonde === item.blonde,
            )
            if (!product) return null
            return (
              <div className="cart-item" key={`${item.sku}-${item.blonde}`}>
                <div className="cart-copy">
                  <strong>
                    {product.productType} {product.lengthIn && `${product.lengthIn}″`}
                  </strong>
                  <span>
                    {product.line} · {item.blonde ? 'Blonde +30%' : 'Standard shade'}
                  </span>
                </div>
                <div className="cart-line-total">
                  <strong>{pricedItem ? money(pricedItem.lineUsd) : '—'}</strong>
                  <small>
                    {pricedItem ? `¥${pricedItem.lineCny.toLocaleString()}` : '—'}
                  </small>
                </div>
                <input
                  aria-label={`Quantity for ${product.sku}`}
                  type="number"
                  min={product.unit === 'per_kg' ? 0.001 : 1}
                  step={product.unit === 'per_kg' ? 0.1 : 1}
                  value={item.quantity}
                  onChange={(event) => onUpdateItem(index, {
                    quantity: Number(event.target.value),
                  })}
                />
                <button
                  className="remove"
                  aria-label="Remove item"
                  onClick={() => onRemoveItem(index)}
                >×</button>
              </div>
            )
          })}
        </div>
      )}

      <form
        className="order-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (ready && !submitting) onSubmit()
        }}
      >
      <div className="customer">
        <h3>Customer</h3>
        <div className="field-row">
          <label className="field" htmlFor="customer-name">
            <span>Name <b aria-hidden="true">*</b></span>
            <input
              id="customer-name"
              placeholder="Customer name"
              value={draft.customerName}
              required
              aria-invalid={!draft.customerName.trim()}
              onChange={(event) => onUpdateDetails({
                customerName: event.target.value,
              })}
            />
          </label>
          <label className="field" htmlFor="customer-contact">
            <span>Contact <b aria-hidden="true">*</b></span>
            <input
              id="customer-contact"
              placeholder="Phone / WeChat / email"
              value={draft.customerContact}
              required
              aria-invalid={!draft.customerContact.trim()}
              onChange={(event) => onUpdateDetails({
                customerContact: event.target.value,
              })}
            />
          </label>
        </div>
        {detailsError && (
          <div id="checkout-requirements" className="alert order-error" role="alert">
            {detailsError}
          </div>
        )}
        <label className="switch-row">
          <span>
            <strong>Expo discount</strong>
            <small>One 10% discount maximum</small>
          </span>
          <input
            type="checkbox"
            checked={draft.expoDiscountEnabled}
            onChange={(event) => onUpdateDetails({
              expoDiscountEnabled: event.target.checked,
            })}
          />
        </label>
      </div>

      <div className="summary">
        <div>
          <span>Subtotal</span>
          <strong>{pricing ? money(pricing.subtotalUsd) : '—'}</strong>
        </div>
        <div>
          <span>
            {pricing?.discountKind === 'volume' ? 'Volume discount' :
              pricing?.discountKind === 'expo' ? 'Expo discount' : 'Discount'}
          </span>
          <strong>{pricing ? `−${money(pricing.discountUsd)}` : '—'}</strong>
        </div>
        <div className="total">
          <span>Total USD</span>
          <strong>{pricing ? money(pricing.totalUsd) : '—'}</strong>
        </div>
        <div className="secondary-total">
          <span>
            {pricing ? `${(pricing.totalWeightG / 1000).toFixed(2)} kg` : '0 kg'}
          </span>
          <span>
            {pricing ? `≈ ¥${pricing.totalCny.toLocaleString()}` : '≈ ¥0'}
          </span>
        </div>
      </div>
      <button
        type="submit"
        className="primary checkout-button"
        disabled={!ready || submitting}
        aria-describedby={detailsError ? 'checkout-requirements' : undefined}
      >
        {submitting ? 'Saving order…' :
          online ? 'Create payment link' : 'Reconnect to create payment link'}
      </button>
      <p className="save-note">Draft saves automatically on this device.</p>
      </form>
    </aside>
  )
}
