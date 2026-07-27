import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'csv-parse/sync'

export type ProductUnit =
  | 'pack_100pcs'
  | 'pack_20pcs'
  | 'per_100g'
  | 'per_kg'
  | 'pack'

export type Product = {
  sku: string
  line: string
  productType: string
  lengthIn: string
  unit: ProductUnit
  packWeightG: number | null
  priceUsdCents: number
  priceCny: number
}

type CatalogRow = Record<string, string>

const columns = [
  'sku',
  'line',
  'product_type',
  'length_in',
  'unit',
  'pack_weight_g',
  'price_usd',
  'price_cny',
] as const

const units = new Set<ProductUnit>([
  'pack_100pcs',
  'pack_20pcs',
  'per_100g',
  'per_kg',
  'pack',
])

function positiveNumber(value: string, field: string, sku: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${sku}: ${field} must be a positive number`)
  }
  return parsed
}

export function parseCatalog(csv: string): Product[] {
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CatalogRow[]

  if (!rows.length) throw new Error('Catalog is empty')
  const actualColumns = Object.keys(rows[0])
  if (
    columns.some((column) => !actualColumns.includes(column)) ||
    actualColumns.some((column) => !columns.includes(column as typeof columns[number]))
  ) {
    throw new Error(`Catalog columns must be: ${columns.join(', ')}`)
  }

  const seen = new Set<string>()
  return rows.map((row, index) => {
    const sku = row.sku?.trim()
    if (!sku) throw new Error(`Row ${index + 2}: sku is required`)
    if (seen.has(sku)) throw new Error(`Duplicate SKU: ${sku}`)
    seen.add(sku)

    if (!row.line || !row.product_type) {
      throw new Error(`${sku}: line and product_type are required`)
    }
    if (!units.has(row.unit as ProductUnit)) {
      throw new Error(`${sku}: unsupported unit ${row.unit}`)
    }

    const unit = row.unit as ProductUnit
    const weight = row.pack_weight_g
      ? positiveNumber(row.pack_weight_g, 'pack_weight_g', sku)
      : null
    if (unit !== 'pack' && weight === null) {
      throw new Error(`${sku}: pack_weight_g is required for ${unit}`)
    }

    return {
      sku,
      line: row.line,
      productType: row.product_type,
      lengthIn: row.length_in ?? '',
      unit,
      packWeightG: unit === 'per_kg' ? 1000 : weight,
      priceUsdCents: Math.round(positiveNumber(row.price_usd, 'price_usd', sku) * 100),
      priceCny: positiveNumber(row.price_cny, 'price_cny', sku),
    }
  })
}

export function loadCatalog(
  path = process.env.CATALOG_PATH ??
    resolve(__dirname, '..', 'data', 'trunov_price_list.csv'),
) {
  return parseCatalog(readFileSync(path, 'utf8'))
}

export function catalogBySku(products: Product[]) {
  return new Map(products.map((product) => [product.sku, product]))
}
