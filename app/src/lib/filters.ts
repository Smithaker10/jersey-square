import type { FilterState, JerseyProduct, SortOption } from '@/types/product';

export function filterAndSortProducts(
  products: JerseyProduct[],
  filters: FilterState,
  options?: { sport?: string; category?: string },
): JerseyProduct[] {
  let result = [...products];

  const sport = options?.sport ?? filters.sport;
  if (sport && sport !== 'all') {
    result = result.filter((p) => p.sport === sport);
  }

  const category = options?.category ?? filters.category;
  if (category && category !== 'all') {
    result = result.filter((p) => p.category === category);
  }

  if (filters.team !== 'all') {
    result = result.filter((p) => p.team === filters.team);
  }

  result = result.filter(
    (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice,
  );

  return sortProducts(result, filters.sort);
}

export function sortProducts(products: JerseyProduct[], sort: SortOption) {
  const sorted = [...products];

  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'latest':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case 'popular':
    default:
      return sorted.sort((a, b) => b.popular - a.popular);
  }
}
