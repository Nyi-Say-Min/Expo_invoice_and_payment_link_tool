import { useEffect, useState } from 'react'
import { getPricing } from '../../../api/order-api'
import type { Draft, Pricing } from '../../../types/commerce'

export function usePricingPreview(draft: Draft, enabled: boolean) {
  const [pricing, setPricing] = useState<Pricing | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!draft.items.length) {
        setPricing(null)
        setError('')
        return
      }
      if (!enabled) return
      void getPricing(draft.items, draft.expoDiscountEnabled)
        .then((result) => {
          setPricing(result)
          setError('')
        })
        .catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : 'Pricing unavailable')
        })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [draft.expoDiscountEnabled, draft.items, enabled])

  return { pricing, pricingError: error }
}
