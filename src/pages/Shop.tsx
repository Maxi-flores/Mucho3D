import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { BentoGrid, ProductDetail } from '@/components/shop'
import { CommandPalette } from '@/components/ai'
import { Input, Badge, Button } from '@/components/ui'
import { useShopStore } from '@/store'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { fadeInUp } from '@/lib/animations'

type ShopSortOption = 'name' | 'price-asc' | 'price-desc' | 'featured'

export function Shop() {
  const products = useShopStore((state) => state.getFilteredProducts())
  const selectedCategory = useShopStore((state) => state.selectedCategory)
  const setSelectedCategory = useShopStore((state) => state.setSelectedCategory)
  const searchQuery = useShopStore((state) => state.searchQuery)
  const setSearchQuery = useShopStore((state) => state.setSearchQuery)
  const sortBy = useShopStore((state) => state.sortBy)
  const setSortBy = useShopStore((state) => state.setSortBy)

  const [showFilters, setShowFilters] = useState(false)

  return (
    <DashboardLayout>
      <CommandPalette />
      <ProductDetail />

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Shop
          </h1>
          <p className="text-white/60">
            Browse our collection of filaments, parts, and accessories
          </p>
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="glass-panel rounded-xl p-6 space-y-4"
        >
          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ShopSortOption)}
                className="glass-panel px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="name">Name</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>

              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={18} />
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'primary' : 'default'}
                className="cursor-pointer capitalize"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Results Count */}
          <div className="text-sm text-white/60">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <BentoGrid products={products} />
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
