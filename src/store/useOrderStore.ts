import { create } from 'zustand'
import { Order, OrderStatus, Platform } from '../types'

interface Filters {
  platform: Platform | 'all'
  search: string
  dateFrom: string
  dateTo: string
}

interface OrderState {
  orders: Order[]
  filters: Filters
  selectedOrderId: string | null
  setOrders: (orders: Order[]) => void
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  setSelectedOrderId: (id: string | null) => void
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  filteredOrders: () => Order[]
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  filters: { platform: 'all', search: '', dateFrom: '', dateTo: '' },
  selectedOrderId: null,

  setOrders: (orders) => set({ orders }),

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  setSelectedOrderId: (id) => set({ selectedOrderId: id }),

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status } : o,
      ),
    })),

  filteredOrders: () => {
    const { orders, filters } = get()
    return orders.filter((order) => {
      if (filters.platform !== 'all' && order.platform !== filters.platform) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !order.platformOrderId.toLowerCase().includes(q) &&
          !order.customerName.toLowerCase().includes(q) &&
          !order.customerEmail.toLowerCase().includes(q)
        )
          return false
      }
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom)
        if (new Date(order.createdAt) < from) return false
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo)
        to.setHours(23, 59, 59)
        if (new Date(order.createdAt) > to) return false
      }
      return true
    })
  },
}))
