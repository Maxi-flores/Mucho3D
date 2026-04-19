import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Minus, Plus, Package, Truck, Shield } from 'lucide-react'
import { useShopStore } from '@/store'
import { modalBackdrop, modalContent } from '@/lib/animations'
import { formatCurrency } from '@/lib/utils'
import { Button, Badge, Panel } from '@/components/ui'

export function ProductDetail() {
  const selectedProduct = useShopStore((state) => state.selectedProduct)
  const setSelectedProduct = useShopStore((state) => state.setSelectedProduct)
  const addToCart = useShopStore((state) => state.addToCart)

  const [quantity, setQuantity] = useState(1)

  if (!selectedProduct) return null

  const handleClose = () => {
    setSelectedProduct(null)
    setQuantity(1)
  }

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity)
    handleClose()
  }

  return (
    <AnimatePresence>
      {selectedProduct && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              variants={modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <Panel className="relative">
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
                >
                  <X size={24} />
                </button>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left: Image */}
                  <div>
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/10 to-blue-600/10 flex items-center justify-center overflow-hidden">
                      <div className="text-9xl text-primary/30">📦</div>
                    </div>

                    {/* Gallery thumbnails (placeholder) */}
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-lg bg-slate-800 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="space-y-6">
                    {/* Title and Category */}
                    <div>
                      <Badge variant="primary" size="sm">
                        {selectedProduct.category}
                      </Badge>
                      <h2 className="text-3xl font-bold text-white mt-3">
                        {selectedProduct.name}
                      </h2>
                      <p className="text-white/60 mt-2">
                        {selectedProduct.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div>
                      <div className="text-4xl font-bold text-primary font-mono">
                        {formatCurrency(selectedProduct.price, selectedProduct.currency)}
                      </div>
                      <div className="text-sm text-white/60 mt-1">
                        {selectedProduct.stock > 0
                          ? `${selectedProduct.stock} in stock`
                          : 'Out of stock'}
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.tags.map((tag) => (
                          <Badge key={tag} variant="default">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Quantity
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="text-xl font-mono font-bold text-white min-w-[3ch] text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                          disabled={quantity >= selectedProduct.stock}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={selectedProduct.stock === 0}
                      leftIcon={<ShoppingCart size={20} />}
                      className="w-full"
                    >
                      Add to Cart - {formatCurrency(selectedProduct.price * quantity, selectedProduct.currency)}
                    </Button>

                    {/* Features */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-3 text-sm text-white/80">
                        <Package size={20} className="text-primary" />
                        <span>Premium packaging included</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/80">
                        <Truck size={20} className="text-primary" />
                        <span>Free shipping on orders over $50</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/80">
                        <Shield size={20} className="text-primary" />
                        <span>30-day money-back guarantee</span>
                      </div>
                    </div>

                    {/* Specifications */}
                    {selectedProduct.specifications && (
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="font-semibold text-white mb-3">Specifications</h3>
                        <div className="space-y-2">
                          {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-white/60">{key}</span>
                              <span className="text-white font-mono">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
