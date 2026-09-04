import { create } from 'zustand';
import { catalogProducts } from '@/data/catalog';
import type { CatalogCategory } from '@/lib/supabase/mappers';
import { fetchCategories } from '@/lib/supabase/categories';
import {
  fetchAllProducts,
  searchProductsSupabase,
  subscribeToProducts,
} from '@/lib/supabase/products';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { JerseyProduct, Sport } from '@/types/product';

const CATALOG_CACHE_KEY = 'jerseysquare-catalog-cache-v5';

type CachedCatalog = {
  products: JerseyProduct[];
  categories: CatalogCategory[];
};

function readCachedCatalog(): CachedCatalog | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as Partial<CachedCatalog>;
    if (!Array.isArray(parsed.products) || !Array.isArray(parsed.categories)) {
      return null;
    }

    return {
      products: parsed.products,
      categories: parsed.categories,
    };
  } catch {
    return null;
  }
}

function writeCachedCatalog(products: JerseyProduct[], categories: CatalogCategory[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ products, categories }));
  } catch {
    // Ignore cache write failures.
  }
}

const cachedCatalog = readCachedCatalog();

interface CatalogState {
  products: JerseyProduct[];
  categories: CatalogCategory[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  searchRemote: (query: string, sport?: Sport | null) => Promise<JerseyProduct[]>;
  getCategoriesBySport: (sport: Sport) => CatalogCategory[];
  unsubscribe: (() => void) | null;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  categories: [],
  loading: true,
  error: null,
  initialized: false,
  unsubscribe: null,

  getCategoriesBySport: (sport) =>
    get()
      .categories.filter((c) => c.sport === sport)
      .filter((c) => c.id !== 'indian-embroidery')
      .sort((a, b) => a.sortOrder - b.sortOrder),

  searchRemote: async (query, sport) => {
    if (!isSupabaseConfigured) {
      return [];
    }
    try {
      return await searchProductsSupabase(query, sport);
    } catch {
      return [];
    }
  },

  refresh: async () => {
    if (!isSupabaseConfigured) return;
    try {
      const [products, categories] = await Promise.all([
        fetchAllProducts(),
        fetchCategories(),
      ]);
      set({ products, categories, loading: false, error: null });
      writeCachedCatalog(products, categories);
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load catalog',
        products: catalogProducts,
      });
    }
  },

  init: async () => {
    if (get().initialized) return;

    if (!isSupabaseConfigured) {
      set({
        products: cachedCatalog?.products ?? catalogProducts,
        categories: cachedCatalog?.categories ?? [],
        loading: false,
        initialized: true,
        error: cachedCatalog ? null : 'Supabase not configured — showing offline catalog.',
      });
      return;
    }

    set({
      products: cachedCatalog?.products ?? catalogProducts,
      categories: cachedCatalog?.categories ?? [],
      loading: false,
      error: null,
      initialized: true,
    });

    try {
      const [products, categories] = await Promise.all([
        fetchAllProducts(),
        fetchCategories(),
      ]);

      const unsub = subscribeToProducts(() => {
        get().refresh();
      });

      set({
        products: products.length > 0 ? products : catalogProducts,
        categories,
        loading: false,
        error: products.length === 0 ? 'No products in database yet.' : null,
        unsubscribe: unsub,
      });
      writeCachedCatalog(products.length > 0 ? products : catalogProducts, categories);
    } catch (err) {
      set({
        products: catalogProducts,
        categories: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to connect to Supabase',
      });
    }
  },
}));
