import { useMemo, useState, useEffect } from 'react';
import { CatalogStatus } from '@/components/catalog/CatalogStatus';
import { useParams, useSearchParams, Link } from 'react-router';
import { motion } from 'framer-motion';
import type { FilterState, Sport } from '@/types/product';
import { defaultFilters } from '@/types/product';
import { getSubcategoryLabel, SPORTS } from '@/config/sports';
import { useCatalogStore } from '@/store/catalogStore';
import { filterAndSortProducts } from '@/lib/filters';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductGrid } from '@/components/products/ProductGrid';

/** Look up a subcategory label across all sports. */
function getCategoryLabel(slug: string, sport?: Sport): string {
  if (sport) {
    return getSubcategoryLabel(sport, slug);
  }
  // Search all sports for a matching subcategory
  for (const s of SPORTS) {
    const sub = s.subcategories.find((c) => c.id === slug);
    if (sub) return sub.label;
  }
  // Fallback: title-case the slug
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const sportParam = searchParams.get('sport') as Sport | null;
  const products = useCatalogStore((s) => s.products);
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);

  const maxPrice = useMemo(
    () => (products.length ? Math.max(...products.map((p) => p.price)) : 10000),
    [products],
  );

  const sport =
    sportParam && SPORTS.some((s) => s.id === sportParam) ? sportParam : undefined;

  const label = slug ? getCategoryLabel(slug, sport) : 'Category';

  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    sport: sport ?? 'all',
    category: slug ?? 'all',
    maxPrice,
  });

  useEffect(() => {
    setFilters((f) => ({ ...f, maxPrice }));
  }, [maxPrice]);

  const filtered = useMemo(
    () =>
      filterAndSortProducts(products, filters, {
        sport: sport ?? undefined,
        category: slug,
      }),
    [products, filters, sport, slug],
  );

  return (
    <div className="pt-[100px]">
      <CatalogStatus error={error} />
      <div className="border-b border-gray-100 px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-[1400px]"
        >
          <nav className="mb-2 text-xs text-gray-400">
            <Link to="/" className="hover:text-[#1B2A4A]">
              Home
            </Link>
            {sport && (
              <>
                {' / '}
                <Link to={`/${sport}`} className="hover:text-[#1B2A4A] capitalize">
                  {sport}
                </Link>
              </>
            )}
            {' / '}
            <span className="text-[#1a1a1a]">{label}</span>
          </nav>
          <h1 className="text-3xl font-black uppercase text-[#1a1a1a]">{label}</h1>
        </motion.div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="lg:w-64 shrink-0">
            <ProductFilters
              filters={filters}
              onChange={setFilters}
              sportLocked={sport}
              showSportFilter={!sport}
            />
          </div>
          <div className="min-w-0 flex-1">
            <ProductGrid products={filtered} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
