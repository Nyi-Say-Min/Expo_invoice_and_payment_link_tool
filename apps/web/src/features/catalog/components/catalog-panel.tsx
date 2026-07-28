import type { Filters, Product } from '../../../types/commerce'
import { money, unitLabel } from '../../../utils/format'

type Props = {
  products: Product[]
  filters: Filters
  search: string
  line: string
  type: string
  length: string
  onSearch: (value: string) => void
  onLine: (value: string) => void
  onType: (value: string) => void
  onLength: (value: string) => void
  onAdd: (product: Product, blonde: boolean) => void
}

export function CatalogPanel({
  products,
  filters,
  search,
  line,
  type,
  length,
  onSearch,
  onLine,
  onType,
  onLength,
  onAdd,
}: Props) {
  return (
    <section className="catalog-panel">
      <div className="section-heading">
        <div><span>01</span><h2>Choose products</h2></div>
        <strong>{products.length} {products.length === 1 ? 'item' : 'items'}</strong>
      </div>
      <input
        className="search"
        type="search"
        placeholder="Search SKU, hair type, product…"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        autoFocus={window.matchMedia('(min-width: 821px)').matches}
      />
      <div className="filters">
        <select
          aria-label="Product line"
          value={line}
          onChange={(event) => onLine(event.target.value)}
        >
          <option value="">All lines</option>
          {filters.lines.map((value) => <option key={value}>{value}</option>)}
        </select>
        <select
          aria-label="Product type"
          value={type}
          onChange={(event) => onType(event.target.value)}
        >
          <option value="">All types</option>
          {filters.types.map((value) => <option key={value}>{value}</option>)}
        </select>
        <select
          aria-label="Product length"
          value={length}
          onChange={(event) => onLength(event.target.value)}
        >
          <option value="">All lengths</option>
          {filters.lengths.map((value) =>
            <option key={value} value={value}>{value}″</option>)}
        </select>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.sku}>
            <div className="product-meta">
              <span>{product.line}</span><code>{product.sku}</code>
            </div>
            <h3>{product.productType}</h3>
            <p>
              {product.lengthIn ? `${product.lengthIn}″ · ` : ''}
              {unitLabel(product.unit)}
            </p>
            <div className="price-row">
              <div>
                <strong>{money(product.priceUsd)}</strong>
                <small>¥{product.priceCny}</small>
              </div>
              <div className="add-actions">
                <button onClick={() => onAdd(product, false)}>Add</button>
                <button className="blonde" onClick={() => onAdd(product, true)}>
                  + Blonde
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
