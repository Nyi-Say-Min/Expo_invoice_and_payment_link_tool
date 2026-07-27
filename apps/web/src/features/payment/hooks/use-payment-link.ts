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

type PaymentError = '' | 'validation' | 'payment' | 'status'
type PaymentSource = '' | 'new-order' | 'history'

export function usePaymentLink() {
  const [savedOrder, setSavedOrder] = useState<Order | null>(null)
  const [result, setResult] = useState<PaymentLinkResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<PaymentError>('')
  const [source, setSource] = useState<PaymentSource>('')
  const inFlight = useRef(false)

  async function submit(draft: Draft) {
    if (inFlight.current) return
    if (!draft.items.length) return setError('validation')
    if (!draft.customerName.trim()) return setError('validation')
    if (!draft.customerContact.trim()) {
      return setError('validation')
    }

    inFlight.current = true
    setSource('new-order')
    setLoading(true)
    setError('')
    try {
      const order = savedOrder ?? await createOrder(draft)
      setSavedOrder(order)
      const payment = await createPaymentLink(order.id)
      setSavedOrder(payment.order)
      setResult(payment)
    } catch {
      setError('payment')
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }

  async function resume(
    orderId: string,
    paymentSource: PaymentSource = 'history',
  ) {
    if (inFlight.current) return
    inFlight.current = true
    setSource(paymentSource)
    setLoading(true)
    setError('')
    try {
      const payment = await createPaymentLink(orderId)
      setSavedOrder(payment.order)
      setResult(payment)
    } catch {
      setError('payment')
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }

  function retry() {
    if (savedOrder) void resume(savedOrder.id, source || 'new-order')
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
    } catch {
      setError('status')
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }

  function reset() {
    setSavedOrder(null)
    setResult(null)
    setError('')
    setSource('')
  }

  return {
    savedOrder,
    result,
    loading,
    error,
    source,
    submit,
    resume,
    retry,
    refresh,
    reset,
  }
}
