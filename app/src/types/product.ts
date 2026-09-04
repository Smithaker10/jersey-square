export type Sport = 'football' | 'f1' | 'cricket';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder';

export type SortOption = 'latest' | 'price-asc' | 'price-desc' | 'popular';

export interface JerseyProduct {
  id: number;
  title: string;
  sport: Sport;
  category: string;
  categoryLabel: string;
  team: string;
  player: string | null;
  description?: string;
  stockStatus?: StockStatus;
  price: number;
  oldPrice: number;
  image: string;
  discount: string;
  tags: string[];
  popular: number;
  createdAt: string;
}

export interface FilterState {
  sport: Sport | 'all';
  category: string | 'all';
  team: string | 'all';
  minPrice: number;
  maxPrice: number;
  sort: SortOption;
}

export const defaultFilters: FilterState = {
  sport: 'all',
  category: 'all',
  team: 'all',
  minPrice: 0,
  maxPrice: 10000,
  sort: 'popular',
};

/** @deprecated Use JerseyProduct — kept for legacy components */
export interface Product {
  id: number;
  name: string;
  category: string;
  categoryLabel: string;
  description?: string;
  price: number;
  oldPrice: number;
  image: string;
  discount: string;
}

export interface Category {
  id: string;
  title: string;
  subtitle: string;
  products: Product[];
}

export function toLegacyProduct(p: JerseyProduct): Product {
  const oldPrice = p.oldPrice > p.price ? p.oldPrice : p.price + 300;
  const discountPercent = Math.round(((oldPrice - p.price) / oldPrice) * 100);
  const discount = p.discount && p.discount !== '' && p.discount !== '-0%' ? p.discount : `-${discountPercent}%`;

  return {
    id: p.id,
    name: p.title,
    category: p.category,
    categoryLabel: p.categoryLabel,
    price: p.price,
    oldPrice,
    image: p.image,
    discount,
  };
}
