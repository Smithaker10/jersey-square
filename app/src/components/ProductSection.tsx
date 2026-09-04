import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { SectionHeader } from './SectionHeader';
import { useCatalogStore } from '@/store/catalogStore';

export interface ProductSectionCategory {
  id: string;
  title: string;
  subtitle: string;
}

interface ProductSectionProps {
  category: ProductSectionCategory;
  sport?: 'football' | 'f1' | 'cricket';
}

export function ProductSection({ category, sport = 'football' }: ProductSectionProps) {
  const allProducts = useCatalogStore((s) => s.products);
  const products = allProducts.filter(
    (p) => p.sport === sport && p.category === category.id,
  );

  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      id={category.id}
      ref={sectionRef}
      className="scroll-mt-[180px] py-8 sm:py-12"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionHeader
            title={category.title}
            subtitle={
              category.subtitle || 'Premium football, F1 & cricket sportswear.'
            }
          />
        </motion.div>

        {products.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-500">
            No jerseys in this category yet.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
