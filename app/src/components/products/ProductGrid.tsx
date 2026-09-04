import { motion } from 'framer-motion';
import type { JerseyProduct } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/products/ProductSkeleton';

interface ProductGridProps {
  products: JerseyProduct[];
  loading?: boolean;
  highlightQuery?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export function ProductGrid({ products, loading, highlightQuery }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 text-center">
        <p className="text-lg font-semibold text-[#1a1a1a]">No products found</p>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Try adjusting your filters or search for another team, player, or category.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          highlightQuery={highlightQuery}
        />
      ))}
    </motion.div>
  );
}
