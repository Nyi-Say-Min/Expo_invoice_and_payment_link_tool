import { useCallback, useEffect, useState } from 'react'
import {
  getOrders,
  getOrdersCsv,
  refreshOrderStatus,
} from '../../../api/order-api'
import type { Order, Pagination } from '../../../types/commerce'

export type OrdersError = '' | 'load' | 'refresh' | 'export'
const initialPagination: Pagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
}

function saveCsv(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `trunov-orders-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function useOrders(enabled: boolean) {
  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)
  const [refreshingId, setRefreshingId] = useState('')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<OrdersError>('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getOrders(page)
      setOrders(result.orders)
      setPagination(result.pagination)
    } catch {
      setError('load')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    if (!enabled) return
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [enabled, load])

  async function refresh(orderId: string) {
    setRefreshingId(orderId)
    setError('')
    try {
      const refreshed = await refreshOrderStatus(orderId)
      setOrders((current) => current.map((order) =>
        order.id === refreshed.id ? refreshed : order,
      ))
    } catch {
      setError('refresh')
    } finally {
      setRefreshingId('')
    }
  }

  async function exportCsv() {
    setExporting(true)
    setError('')
    try {
      saveCsv(await getOrdersCsv())
    } catch {
      setError('export')
    } finally {
      setExporting(false)
    }
  }

  return {
    orders,
    pagination,
    loading,
    refreshingId,
    exporting,
    error,
    load,
    refresh,
    exportCsv,
    goToPage: setPage,
  }
}
