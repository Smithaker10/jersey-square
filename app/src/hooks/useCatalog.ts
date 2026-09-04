import { useEffect, useState } from 'react';
import { categories as fallbackCategories, type Category } from '@/data/products';
import { fetchCatalog } from '@/lib/api';

export function useCatalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromApi, setFromApi] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchCatalog();
        if (!cancelled) {
          setCategories(data);
          setFromApi(true);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setCategories(fallbackCategories);
          setFromApi(false);
          setError('Showing offline catalog. Start the API server for live data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error, fromApi };
}
