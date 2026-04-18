import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, Cart } from '@/types'
import { MOCK_PRODUCTS } from '@/lib/constants'

interface ShopState {
  // Products
  products: Product[]
  setProducts: (products: Product[]) => void

  // Filters
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: 'name' | 'price-asc' | 'price-desc' | 'featured'
  setSortBy: (sortBy: ShopState['sortBy']) => void

  // Filtered products
  getFilteredProducts: () => Product[]

  // Cart
  cart: Cart
  addToCart: (productId: string, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartItemQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number

  // Selected product (for detail modal)
  selectedProduct: Product | null
  setSelectedProduct: (product: Product | null) => void
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      // Products
      products: MOCK_PRODUCTS as unknown as Product[],
      setProducts: (products) => set({ products }),

      // Filters
      selectedCategory: 'all',
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      sortBy: 'featured',
      setSortBy: (sortBy) => set({ sortBy }),

      // Filtered products
      getFilteredProducts: () => {
        const { products, selectedCategory, searchQuery, sortBy } = get()

        let filtered = [...products]

        // Filter by category
        if (selectedCategory !== 'all') {
          filtered = filtered.filter((p) => p.category === selectedCategory)
        }

        // Filter by search
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.description.toLowerCase().includes(query) ||
              p.tags?.some((tag) => tag.toLowerCase().includes(query))
          )
        }

        // Sort
        switch (sortBy) {
          case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name))
            break
          case 'price-asc':
            filtered.sort((a, b) => a.price - b.price)
            break
          case 'price-desc':
            filtered.sort((a, b) => b.price - a.price)
            break
          case 'featured':
            filtered.sort((a, b) => {
              if (a.featured && !b.featured) return -1
              if (!a.featured && b.featured) return 1
              return 0
            })
            break
        }

        return filtered
      },

      // Cart
      cart: {
        items: [],
        total: 0,
        currency: 'USD',
      },
      addToCart: (productId, quantity = 1) => {
        const { products, cart } = get()
        const product = products.find((p) => p.id === productId)

        if (!product) return

        const existingItem = cart.items.find((item) => item.productId === productId)

        if (existingItem) {
          set({
            cart: {
              ...cart,
              items: cart.items.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            },
          })
        } else {
          set({
            cart: {
              ...cart,
              items: [
                ...cart.items,
                {
                  productId,
                  quantity,
                  price: product.price,
                },
              ],
            },
          })
        }

        // Update total
        const newTotal = get().getCartTotal()
        set((state) => ({
          cart: {
            ...state.cart,
            total: newTotal,
          },
        }))
      },
      removeFromCart: (productId) => {
        set((state) => ({
          cart: {
            ...state.cart,
            items: state.cart.items.filter((item) => item.productId !== productId),
          },
        }))

        // Update total
        const newTotal = get().getCartTotal()
        set((state) => ({
          cart: {
            ...state.cart,
            total: newTotal,
          },
        }))
      },
      updateCartItemQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId)
          return
        }

        set((state) => ({
          cart: {
            ...state.cart,
            items: state.cart.items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            ),
          },
        }))

        // Update total
        const newTotal = get().getCartTotal()
        set((state) => ({
          cart: {
            ...state.cart,
            total: newTotal,
          },
        }))
      },
      clearCart: () =>
        set({
          cart: {
            items: [],
            total: 0,
            currency: 'USD',
          },
        }),
      getCartTotal: () => {
        const { cart } = get()
        return cart.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },
      getCartItemCount: () => {
        const { cart } = get()
        return cart.items.reduce((count, item) => count + item.quantity, 0)
      },

      // Selected product
      selectedProduct: null,
      setSelectedProduct: (product) => set({ selectedProduct: product }),
    }),
    {
      name: 'mucho3d-shop-storage',
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
)
