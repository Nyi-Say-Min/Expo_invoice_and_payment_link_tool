import { useRef, useState } from 'react'
import {
  createOrder,
  createPaymentLink,
  refreshOrderStatus,
} from '../../../api/order-api'
import type {
  Draft,
  Order,
  PaymentLinkResult,
} from '../../../types/commerce'

function message(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Payment link unavailable'
}

export function usePaymentLink() {
  const [savedOrder, setSavedOrder] = useState<Order | null>(null)
  const [result, setResult] = useState<PaymentLinkResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)

  async function submit(draft: Draft) {
    if (inFlight.current) return
    if (!draft.items.length) return setError('Add at least one product')
    if (!draft.customerName.trim()) return setError('Customer name is required')
    if (!draft.customerContact.trim()) {
      return setError('Customer contact is required')
    }

    inFlight.current = true
    setLoading(true)
    setError('')
    try {
      const order = savedOrder ?? await createOrder(draft)
      setSavedOrder(order)
      const payment = await createPaymentLink(order.id)
      setSavedOrder(payment.order)
      setResult(payment)
    } catch (cause) {
      setError(message(cause))
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }

  async function refresh() {
    const order = result?.order
    if (!order || inFlight.current) return
    inFlight.current = true
    setLoading(true)
    setError('')
    try {
      const refreshed = await refreshOrderStatus(order.id)
      setSavedOrder(refreshed)
      setResult((current) => current && { ...current, order: refreshed })
    } catch (cause) {
      setError(message(cause))
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }

  function reset() {
    setSavedOrder(null)
    setResult(null)
    setError('')
  }

  return {
    savedOrder,
    result,
    loading,
    error,
    submit,
    refresh,
    reset,
  }
}
