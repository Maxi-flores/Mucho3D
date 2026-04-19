import { motion } from 'framer-motion'
import { ShoppingCart, Star } from 'lucide-react'
import type { Product } from '@/types'
import { useShopStore } from '@/store'
import { cardHover } from '@/lib/animations'
import { formatCurrency } from '@/lib/utils'
import { Button, Badge } from '@/components/ui'
import { cn } from '@/lib/cn'

interface ProductCardProps {
  product: Product
  size?: '1x1' | '2x1' | '1x2' | '2x2'
}

export function ProductCard({ product, size = '1x1' }: ProductCardProps) {
  const setSelectedProduct = useShopStore((state) => state.setSelectedProduct)
  const addToCart = useShopStore((state) => state.addToCart)

  const sizeClasses = {
    '1x1': 'col-span-1 row-span-1',
    '2x1': 'col-span-2 row-span-1',
    '1x2': 'col-span-1 row-span-2',
    '2x2': 'col-span-2 row-span-2',
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart(product)
  }

  return (
    <motion.div
      variants={cardHover}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onClick={() => setSelectedProduct(product)}
      className={cn(
        'card-hover relative overflow-hidden cursor-pointer group',
        sizeClasses[size],
        size.includes('2x') ? 'p-8' : 'p-6'
      )}
    >
      {/* Featured Badge */}
      {product.featured && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="primary" size="sm">
            <Star size={12} className="mr-1" />
            Featured
          </Badge>
        </div>
      )}

      {/* Product Image Placeholder */}
      <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/10 to-blue-600/10 mb-4 flex items-center justify-center overflow-hidden">
        <div className="text-6xl text-primary/30">📦</div>
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-white text-lg line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-white/60 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Price and Actions */}
        <div className="flex items-end justify-between pt-2">
          <div>
            <div className="text-2xl font-bold text-primary font-mono">
              {formatCurrency(product.price, product.currency)}
            </div>
            <div className="text-xs text-white/60">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            leftIcon={<ShoppingCart size={16} />}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  )
}
