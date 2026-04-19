import { create } from 'zustand'
import type { Product } from '@/types'

interface CartItem {
  product: Product
  quantity: number
}

interface ShopState {
  selectedProduct: Product | null
  cart: CartItem[]
  setSelectedProduct: (product: Product | null) => void
  addToCart: (product: Product | string, quantity?: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
}

export const useShopStore = create<ShopState>((set) => ({
  selectedProduct: null,
  cart: [],
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  addToCart: (product, quantity = 1) =>
    set((state) => {
      const isProduct = typeof product !== 'string'
      if (!isProduct) return { cart: state.cart }
      return {
        cart: [...state.cart, { product, quantity }],
      }
    }),
  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    })),
  clearCart: () => set({ cart: [] }),
}))
