import type { JerseyProduct } from '@/types/product';

export function searchProducts(products: JerseyProduct[], query: string): JerseyProduct[] {
  let q = query.trim().toLowerCase();
  if (!q) return [];

  // Normalize common club search terms
  if (q.includes('barca') || q.includes('barcelona') || q === 'fcb') {
    q = 'barcelona';
  } else if (q === 'real' || q.includes('real madrid')) {
    q = 'real madrid';
  }

  const terms = q.split(/\s+/).filter(Boolean);

  return products.filter((product) => {
    const haystack = [
      product.title,
      product.team,
      product.player ?? '',
      product.sport,
      product.category,
      product.categoryLabel,
      ...product.tags,
    ]
      .join(' ')
      .toLowerCase();

    return terms.every((term) => haystack.includes(term));
  });
}

export function highlightMatch(text: string, query: string): string {
  const q = query.trim();
  if (!q) return text;

  const regex = new RegExp(`(${escapeRegex(q)})`, 'gi');
  return text.replace(regex, '<mark class="bg-amber-200/80 text-[#1a1a1a] rounded px-0.5">$1</mark>');
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
