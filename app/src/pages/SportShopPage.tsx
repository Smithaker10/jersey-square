import { useMemo, useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import type { FilterState, Sport } from '@/types/product';
import { defaultFilters } from '@/types/product';
import { getSportConfig } from '@/config/sports';
import { useCatalogStore } from '@/store/catalogStore';
import { filterAndSortProducts } from '@/lib/filters';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductGrid } from '@/components/products/ProductGrid';
import { CatalogStatus } from '@/components/catalog/CatalogStatus';
import { ClubShowcaseSection } from '@/components/football/ClubShowcaseSection';

const sportMap: Record<string, Sport> = {
  football: 'football',
  f1: 'f1',
  cricket: 'cricket',
};

export function SportShopPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const teamParam = searchParams.get('team') || searchParams.get('q');
  const pathKey = location.pathname.replace(/^\//, '');
  const sport = sportMap[pathKey] ?? 'football';
  const config = getSportConfig(sport);
  const products = useCatalogStore((s) => s.products);
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);

  const maxPrice = useMemo(
    () =>
      Math.max(
        3000,
        ...products.filter((p) => p.sport === sport).map((p) => p.price),
        0,
      ),
    [products, sport],
  );

  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    sport,
    maxPrice,
  });

  useEffect(() => {
    let initialTeam = 'all';
    if (teamParam) {
      const lower = teamParam.toLowerCase();
      if (lower.includes('barca') || lower.includes('barcelona') || lower === 'fcb') {
        initialTeam = 'Barcelona';
      } else if (lower === 'real' || lower.includes('real madrid')) {
        initialTeam = 'Real Madrid';
      } else {
        const found = products.find(
          (p) => p.team.toLowerCase() === lower,
        );
        if (found) initialTeam = found.team;
      }
    }

    setFilters((f) => ({ ...f, sport, maxPrice, team: initialTeam }));
  }, [sport, maxPrice, teamParam, products]);

  const sportProducts = products.filter((p) => p.sport === sport);
  const filtered = useMemo(
    () => filterAndSortProducts(sportProducts, filters, { sport }),
    [sportProducts, filters, sport],
  );

  return (
    <div className="pt-[100px]">
      <CatalogStatus loading={loading} error={error} />
      <div className="relative overflow-hidden bg-[#1B2A4A] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto max-w-[1400px]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            JerseySquare · Official Collection
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">{config.label}</h1>
          <p className="mt-3 max-w-xl text-white/75">{config.description}</p>
        </motion.div>
      </div>

      {sport === 'football' && <ClubShowcaseSection />}

      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="shrink-0 lg:w-64">
            <ProductFilters
              filters={filters}
              onChange={setFilters}
              sportLocked={sport}
              showSportFilter={false}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-4 text-sm text-gray-500">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </p>
            <ProductGrid products={filtered} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
