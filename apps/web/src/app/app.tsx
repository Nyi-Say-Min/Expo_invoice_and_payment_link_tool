import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { getCatalog } from '../api/catalog-api'
import { PasscodeGate } from '../features/auth/components/passcode-gate'
import { CatalogPanel } from '../features/catalog/components/catalog-panel'
import { OrderPanel } from '../features/order/components/order-panel'
import { useOrderDraft } from '../features/order/hooks/use-order-draft'
import { usePricingPreview } from '../features/order/hooks/use-pricing-preview'
import { OrdersPanel } from '../features/orders/components/orders-panel'
import { useOrders } from '../features/orders/hooks/use-orders'
import { PaymentDialog } from '../features/payment/components/payment-dialog'
import { usePaymentLink } from '../features/payment/hooks/use-payment-link'
import type { Filters, Product } from '../types/commerce'
import './app.css'

const emptyFilters: Filters = { lines: [], types: [], lengths: [] }
const storedPasscode = sessionStorage.getItem('trunov-passcode') ?? ''
type View = 'new-order' | 'orders'

export default function App() {
  const [passcode, setPasscode] = useState(storedPasscode)
  const [passcodeInput, setPasscodeInput] = useState(storedPasscode)
  const [products, setProducts] = useState<Product[]>([])
  const [filters, setFilters] = useState(emptyFilters)
  const [search, setSearch] = useState('')
  const [line, setLine] = useState('')
  const [type, setType] = useState('')
  const [length, setLength] = useState('')
  const [view, setView] = useState<View>('new-order')
  const [loading, setLoading] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const draftState = useOrderDraft()
  const payment = usePaymentLink()
  const orderHistory = useOrders(Boolean(passcode && view === 'orders'))
  const { pricing, pricingError } = usePricingPreview(
    draftState.draft,
    Boolean(passcode && online),
  )

  const connect = useCallback(async (code: string) => {
    setLoading(true)
    sessionStorage.setItem('trunov-passcode', code)
    try {
      const result = await getCatalog()
      setProducts(result.products)
      setFilters(result.filters)
      setPasscode(code)
    } catch {
      sessionStorage.removeItem('trunov-passcode')
      setPasscode('')
      toast.error('Unable to open the workspace. Check the passcode and connection.', {
        toastId: 'workspace-access-error',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!storedPasscode) return
    const timer = window.setTimeout(() => void connect(storedPasscode), 0)
    return () => window.clearTimeout(timer)
  }, [connect])

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    if (!pricingError) return
    toast.error('Unable to update pricing. Check your connection and try again.', {
      toastId: 'pricing-error',
    })
  }, [pricingError])

  useEffect(() => {
    if (payment.error === 'payment') {
      toast.error('Unable to complete this order. Check your connection and try again.', {
        toastId: 'payment-error',
      })
    }
    if (payment.error === 'status') {
      toast.error('Unable to refresh the payment status. Please try again.', {
        toastId: 'payment-status-error',
      })
    }
  }, [payment.error])

  useEffect(() => {
    if (orderHistory.error === 'load') {
      toast.error('Unable to load orders. Check your connection and try again.', {
        toastId: 'orders-load-error',
      })
    }
    if (orderHistory.error === 'refresh') {
      toast.error('Unable to refresh the payment status. Please try again.', {
        toastId: 'orders-refresh-error',
      })
    }
    if (orderHistory.error === 'export') {
      toast.error('Unable to export orders. Please try again.', {
        toastId: 'orders-export-error',
      })
    }
  }, [orderHistory.error])

  const visibleProducts = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return products.filter((product) => {
      const text =
        `${product.sku} ${product.line} ${product.productType} ${product.lengthIn}`
          .toLowerCase()
      return (!needle || text.includes(needle)) &&
        (!line || product.line === line) &&
        (!type || product.productType === type) &&
        (!length || product.lengthIn === length)
    })
  }, [length, line, products, search, type])

  if (!passcode) return (
    <PasscodeGate
      value={passcodeInput}
      loading={loading}
      onChange={setPasscodeInput}
      onSubmit={() => void connect(passcodeInput)}
    />
  )

  return (
    <div className="app-shell">
      <header>
        <div><span className="eyebrow">TRUNOV HAIR</span><h1>Expo order desk</h1></div>
        <div className="header-actions">
          <nav className="desk-nav" aria-label="Workspace">
            <button
              className={view === 'new-order' ? 'active' : ''}
              onClick={() => setView('new-order')}
            >
              New order
            </button>
            <button
              className={view === 'orders' ? 'active' : ''}
              onClick={() => setView('orders')}
            >
              Orders
            </button>
          </nav>
          <span className={`network ${online ? '' : 'offline'}`}>
            {online ? 'Online' : 'Offline · draft saved'}
          </span>
          <button className="quiet" onClick={() => {
            sessionStorage.removeItem('trunov-passcode')
            setPasscode('')
          }}>Lock</button>
        </div>
      </header>
      {view === 'new-order' ? (
        <main className="workspace">
          <CatalogPanel
            products={visibleProducts} filters={filters}
            search={search} line={line} type={type} length={length}
            onSearch={setSearch} onLine={setLine} onType={setType}
            onLength={setLength} onAdd={draftState.addItem}
          />
          <OrderPanel
            draft={draftState.draft} products={products} pricing={pricing}
            onUpdateItem={draftState.updateItem}
            onUpdateDetails={draftState.updateDetails}
            onRemoveItem={draftState.removeItem}
            onClear={draftState.clearItems}
            onSubmit={() => void payment.submit(draftState.draft)}
            submitting={payment.loading}
            online={online}
          />
        </main>
      ) : (
        <OrdersPanel
          orders={orderHistory.orders}
          pagination={orderHistory.pagination}
          loading={orderHistory.loading}
          refreshingId={orderHistory.refreshingId}
          paymentLoading={payment.loading}
          exporting={orderHistory.exporting}
          online={online}
          onReload={() => void orderHistory.load()}
          onRefresh={(orderId) => void orderHistory.refresh(orderId)}
          onResume={(orderId) => void payment.resume(orderId)}
          onExport={() => void orderHistory.exportCsv()}
          onPageChange={orderHistory.goToPage}
        />
      )}
      {payment.savedOrder && (
        <PaymentDialog
          order={payment.savedOrder}
          result={payment.result}
          loading={payment.loading}
          onRetry={payment.retry}
          onRefresh={() => void payment.refresh()}
          onNext={() => {
            if (payment.source === 'history') {
              payment.reset()
              void orderHistory.load()
              return
            }
            payment.reset()
            draftState.resetDraft()
          }}
          nextLabel={payment.source === 'history' ? 'Close' : 'Start next order'}
        />
      )}
    </div>
  )
}
