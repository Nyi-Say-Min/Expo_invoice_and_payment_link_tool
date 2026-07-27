import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCatalog } from '../api/catalog-api'
import { PasscodeGate } from '../features/auth/components/passcode-gate'
import { CatalogPanel } from '../features/catalog/components/catalog-panel'
import { OrderPanel } from '../features/order/components/order-panel'
import { useOrderDraft } from '../features/order/hooks/use-order-draft'
import { usePricingPreview } from '../features/order/hooks/use-pricing-preview'
import { PaymentDialog } from '../features/payment/components/payment-dialog'
import { usePaymentLink } from '../features/payment/hooks/use-payment-link'
import type { Filters, Product } from '../types/commerce'
import './app.css'

const emptyFilters: Filters = { lines: [], types: [], lengths: [] }
const storedPasscode = sessionStorage.getItem('trunov-passcode') ?? ''

export default function App() {
  const [passcode, setPasscode] = useState(storedPasscode)
  const [passcodeInput, setPasscodeInput] = useState(storedPasscode)
  const [products, setProducts] = useState<Product[]>([])
  const [filters, setFilters] = useState(emptyFilters)
  const [search, setSearch] = useState('')
  const [line, setLine] = useState('')
  const [type, setType] = useState('')
  const [length, setLength] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const draftState = useOrderDraft()
  const payment = usePaymentLink()
  const { pricing, pricingError } = usePricingPreview(
    draftState.draft,
    Boolean(passcode && online),
  )

  const connect = useCallback(async (code: string) => {
    setLoading(true)
    setError('')
    sessionStorage.setItem('trunov-passcode', code)
    try {
      const result = await getCatalog()
      setProducts(result.products)
      setFilters(result.filters)
      setPasscode(code)
    } catch (cause) {
      sessionStorage.removeItem('trunov-passcode')
      setPasscode('')
      setError(cause instanceof Error ? cause.message : 'Unable to connect')
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
      error={error}
      onChange={setPasscodeInput}
      onSubmit={() => void connect(passcodeInput)}
    />
  )

  const notice = error || pricingError
  return (
    <div className="app-shell">
      <header>
        <div><span className="eyebrow">TRUNOV HAIR</span><h1>Expo order desk</h1></div>
        <div className="header-actions">
          <span className={`network ${online ? '' : 'offline'}`}>
            {online ? 'Online' : 'Offline · draft saved'}
          </span>
          <button className="quiet" onClick={() => {
            sessionStorage.removeItem('trunov-passcode')
            setPasscode('')
          }}>Lock</button>
        </div>
      </header>
      {notice && <button className="alert dismiss" onClick={() => setError('')}>
        {notice} <span>×</span>
      </button>}
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
          submitError={payment.savedOrder ? '' : payment.error}
          online={online}
        />
      </main>
      {payment.savedOrder && (
        <PaymentDialog
          order={payment.savedOrder}
          result={payment.result}
          loading={payment.loading}
          error={payment.error}
          onRetry={() => void payment.submit(draftState.draft)}
          onRefresh={() => void payment.refresh()}
          onNext={() => {
            payment.reset()
            draftState.resetDraft()
          }}
        />
      )}
    </div>
  )
}
