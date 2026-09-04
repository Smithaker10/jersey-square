import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { FilterState } from '@/types/product';
import { defaultFilters } from '@/types/product';
import { useCatalogStore } from '@/store/catalogStore';
import { searchProductsSupabase } from '@/lib/supabase/products';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { searchProducts } from '@/lib/search';
import { filterAndSortProducts } from '@/lib/filters';
import { SearchBar } from '@/components/search/SearchBar';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductGrid } from '@/components/products/ProductGrid';
import { CatalogStatus } from '@/components/catalog/CatalogStatus';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const products = useCatalogStore((s) => s.products);
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);

  const [remoteResults, setRemoteResults] = useState<typeof products | null>(null);
  const [searching, setSearching] = useState(false);

  const maxPrice = useMemo(
    () => (products.length ? Math.max(...products.map((p) => p.price)) : 10000),
    [products],
  );

  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    maxPrice,
  });

  useEffect(() => {
    setFilters((f) => ({ ...f, maxPrice }));
  }, [maxPrice]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const q = query.trim();
      if (!q) {
        setRemoteResults(null);
        setSearching(false);
        return;
      }

      // Check loaded products first for 0ms response
      const local = searchProducts(products, q);
      if (local.length > 0 || products.length > 0 || !isSupabaseConfigured) {
        setRemoteResults(local);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const results = await searchProductsSupabase(
          q,
          filters.sport === 'all' ? null : filters.sport,
        );
        if (!cancelled) setRemoteResults(results);
      } catch {
        if (!cancelled) setRemoteResults(searchProducts(products, q));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query, filters.sport, products]);

  const baseList = query.trim()
    ? (remoteResults ?? searchProducts(products, query))
    : products;

  const filtered = useMemo(
    () => filterAndSortProducts(baseList, filters),
    [baseList, filters],
  );

  return (
    <div className="pt-[100px]">
      <CatalogStatus error={error} />
      <div className="border-b border-gray-100 bg-[#EDE8E0]/30 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl">
            {query ? `Results for "${query}"` : 'Shop all jerseys'}
          </h1>
          <div className="mt-6 max-w-xl">
            <SearchBar />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="shrink-0 lg:w-64">
            <ProductFilters filters={filters} onChange={setFilters} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-4 text-sm text-gray-500">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </p>
            <ProductGrid
              products={filtered}
              loading={loading || searching}
              highlightQuery={query}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
