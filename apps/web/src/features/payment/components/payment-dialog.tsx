import type {
  Order,
  PaymentLinkResult,
} from '../../../types/commerce'
import { money } from '../../../utils/format'

type Props = {
  order: Order
  result: PaymentLinkResult | null
  loading: boolean
  error: string
  onRetry: () => void
  onRefresh: () => void
  onNext: () => void
}

export function PaymentDialog({
  order,
  result,
  loading,
  error,
  onRetry,
  onRefresh,
  onNext,
}: Props) {
  const linkedOrder = result?.order ?? order

  return (
    <div className="dialog-backdrop">
      <section
        className="payment-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
      >
        {!result ? (
          <>
            <span className="dialog-step">Order saved</span>
            <h2 id="payment-title">
              {loading ? 'Preparing the QR code…' : 'Payment link needs a retry'}
            </h2>
            <p>
              Order <strong>#{order.id.slice(0, 8)}</strong> is safely stored.
              Retrying will reuse this order and cannot create a duplicate link.
            </p>
            {error && <div className="alert">{error}</div>}
            <button className="primary" disabled={loading} onClick={onRetry}>
              {loading ? 'Creating payment link…' : 'Retry payment link'}
            </button>
          </>
        ) : (
          <>
            <div className="payment-heading">
              <div>
                <span className="dialog-step">Ready to scan</span>
                <h2 id="payment-title">Payment link created</h2>
              </div>
              <span className={`status ${linkedOrder.status}`}>
                {linkedOrder.status}
              </span>
            </div>
            <div className="payment-content">
              <img src={result.qrCodeDataUrl} alt="Stripe payment QR code" />
              <div className="payment-copy">
                <span>Order #{linkedOrder.id.slice(0, 8)}</span>
                <strong>{money(linkedOrder.totalUsd)}</strong>
                <small>≈ ¥{linkedOrder.totalCny.toLocaleString()}</small>
                <a
                  className="primary payment-link"
                  href={linkedOrder.stripePaymentUrl ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Stripe payment
                </a>
              </div>
            </div>
            {error && <div className="alert">{error}</div>}
            <div className="dialog-actions">
              <button className="quiet bordered" disabled={loading} onClick={onRefresh}>
                {loading ? 'Checking…' : 'Refresh status'}
              </button>
              <button className="primary" onClick={onNext}>Start next order</button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
