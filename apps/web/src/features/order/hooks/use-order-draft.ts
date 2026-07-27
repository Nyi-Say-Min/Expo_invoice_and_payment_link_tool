import { useEffect, useState } from 'react'
import type { CartItem, Draft, Product } from '../../../types/commerce'

const emptyDraft: Draft = {
  items: [], customerName: '', customerContact: '', expoDiscountEnabled: true,
}

function loadDraft() {
  try {
    const stored = localStorage.getItem('trunov-order-draft')
    return stored ? JSON.parse(stored) as Draft : emptyDraft
  } catch {
    localStorage.removeItem('trunov-order-draft')
    return emptyDraft
  }
}

export function useOrderDraft() {
  const [draft, setDraft] = useState<Draft>(loadDraft)

  useEffect(() => {
    localStorage.setItem('trunov-order-draft', JSON.stringify(draft))
  }, [draft])

  function addItem(product: Product, blonde: boolean) {
    setDraft((current) => {
      const index = current.items.findIndex(
        (item) => item.sku === product.sku && item.blonde === blonde,
      )
      const items = [...current.items]
      if (index >= 0) {
        items[index] = { ...items[index], quantity: items[index].quantity + 1 }
      } else {
        items.push({ sku: product.sku, quantity: 1, blonde })
      }
      return { ...current, items }
    })
  }

  function updateItem(index: number, changes: Partial<CartItem>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    }))
  }

  function updateDetails(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }))
  }

  function removeItem(index: number) {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_item, itemIndex) => itemIndex !== index),
    }))
  }

  function clearItems() {
    setDraft((current) => ({ ...current, items: [] }))
  }

  return { draft, addItem, updateItem, updateDetails, removeItem, clearItems }
}
