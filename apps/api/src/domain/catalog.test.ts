import { describe, expect, it } from 'vitest'
import { loadCatalog, parseCatalog } from './catalog.js'

describe('catalog', () => {
  it('loads the authoritative 75-item price list', () => {
    const products = loadCatalog()
    expect(products).toHaveLength(75)
    expect(products.find((product) => product.sku === 'SD-KT-22')).toMatchObject({
      priceUsdCents: 10_000,
      priceCny: 700,
      packWeightG: 70,
    })
  })

  it('keeps the Trial Pack CNY price instead of deriving it from USD', () => {
    const trial = loadCatalog().find((product) => product.sku === 'PROMO-TRIAL')
    expect(trial).toMatchObject({
      priceUsdCents: 14_900,
      priceCny: 999,
      packWeightG: null,
    })
  })

  it('rejects duplicate SKUs and invalid catalog shapes', () => {
    const header =
      'sku,line,product_type,length_in,unit,pack_weight_g,price_usd,price_cny'
    const row = 'A,Line,Type,18,pack,10,1,7'
    expect(() => parseCatalog(`${header}\n${row}\n${row}`)).toThrow('Duplicate SKU')
    expect(() => parseCatalog('sku,line\nA,Line')).toThrow('Catalog columns')
  })
})
