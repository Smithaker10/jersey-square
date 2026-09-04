import type { FilterState, Sport } from '@/types/product';
import { useCatalogStore } from '@/store/catalogStore';
import { SPORTS } from '@/config/sports';

interface ProductFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  sportLocked?: Sport;
  showSportFilter?: boolean;
}

export function ProductFilters({
  filters,
  onChange,
  sportLocked,
  showSportFilter = true,
}: ProductFiltersProps) {
  const products = useCatalogStore((s) => s.products);
  const sportKey = sportLocked ?? (filters.sport !== 'all' ? filters.sport : undefined);
  const teams = [
    ...new Set(
      products
        .filter((p) => !sportKey || p.sport === sportKey)
        .map((p) => p.team)
        .filter(Boolean),
    ),
  ].sort();
  const subcategories = sportLocked
    ? SPORTS.find((s) => s.id === sportLocked)?.subcategories ?? []
    : [];

  const patch = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:sticky lg:top-[120px]">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Filters
      </h3>

      {showSportFilter && !sportLocked && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">Sport</span>
          <select
            value={filters.sport}
            onChange={(e) =>
              patch({ sport: e.target.value as FilterState['sport'], team: 'all' })
            }
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B2A4A]"
          >
            <option value="all">All sports</option>
            {SPORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {(sportLocked ? subcategories : []).length > 0 && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">Category</span>
          <select
            value={filters.category}
            onChange={(e) => patch({ category: e.target.value })}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B2A4A]"
          >
            <option value="all">All categories</option>
            {subcategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {!sportLocked && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">Category</span>
          <select
            value={filters.category}
            onChange={(e) => patch({ category: e.target.value })}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B2A4A]"
          >
            <option value="all">All categories</option>
            {[...new Set(SPORTS.flatMap((s) => s.subcategories))].map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-600">Team</span>
        <select
          value={filters.team}
          onChange={(e) => patch({ team: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B2A4A]"
        >
          <option value="all">All teams</option>
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-600">
          Max price: ₹{filters.maxPrice.toLocaleString('en-IN')}
        </span>
        <input
          type="range"
          min={0}
          max={3000}
          step={50}
          value={filters.maxPrice}
          onChange={(e) => patch({ maxPrice: Number(e.target.value) })}
          className="accent-[#1B2A4A]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-600">Sort by</span>
        <select
          value={filters.sort}
          onChange={(e) => patch({ sort: e.target.value as FilterState['sort'] })}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B2A4A]"
        >
          <option value="popular">Popular</option>
          <option value="latest">Latest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </label>
    </div>
  );
}
