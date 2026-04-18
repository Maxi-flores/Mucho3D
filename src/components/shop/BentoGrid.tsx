import { motion } from 'framer-motion'
import type { Product } from '@/types'
import { ProductCard } from './ProductCard'
import { staggerContainer, staggerItem } from '@/lib/animations'

interface BentoGridProps {
  products: Product[]
  maxItems?: number
}

export function BentoGrid({ products, maxItems }: BentoGridProps) {
  const displayProducts = maxItems ? products.slice(0, maxItems) : products

  // Define bento layout patterns (repeating)
  const patterns: Array<'1x1' | '2x1' | '1x2' | '2x2'> = [
    '2x1', // First item spans 2 columns
    '1x1',
    '1x1',
    '1x2', // Tall item
    '2x1',
    '1x1',
  ]

  const getSize = (index: number): '1x1' | '2x1' | '1x2' | '2x2' => {
    return patterns[index % patterns.length]
  }

  if (displayProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">No products found</p>
        <p className="text-sm text-white/40 mt-2">
          Try adjusting your filters
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[300px]"
    >
      {displayProducts.map((product, index) => (
        <motion.div
          key={product.id}
          variants={staggerItem}
          className={getSize(index)}
        >
          <ProductCard product={product} size={getSize(index)} />
        </motion.div>
      ))}
    </motion.div>
  )
}
