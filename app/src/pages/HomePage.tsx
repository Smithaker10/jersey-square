import { useState, useEffect, useCallback, useMemo } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { SportCollectionSection } from '@/components/home/SportCollectionSection';
import { CategoryTabs } from '@/components/CategoryTabs';
import { ProductSection } from '@/components/ProductSection';
import { TrustBadges } from '@/components/TrustBadges';
import { CatalogStatus } from '@/components/catalog/CatalogStatus';
import { useCatalogStore } from '@/store/catalogStore';
import type { Sport } from '@/types/product';

export function HomePage() {
  const products = useCatalogStore((s) => s.products);
  const categories = useCatalogStore((s) => s.categories);
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);
  const getCategoriesBySport = useCatalogStore((s) => s.getCategoriesBySport);

  const footballCategories = useMemo(() => {
    let cats = [];
    const fromDb = getCategoriesBySport('football');
    if (fromDb.length > 0) {
      cats = fromDb
        .filter((cat) =>
          products.some((p) => p.sport === 'football' && p.category === cat.id),
        )
        .filter((cat) => cat.id !== 'indian-embroidery')
        .map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          count: products.filter((p) => p.sport === 'football' && p.category === c.id).length,
        }));
    } else {
      const ids = [
        ...new Set(
          products.filter((p) => p.sport === 'football').map((p) => p.category),
        ),
      ];
      cats = ids
        .filter((id) => id !== 'indian-embroidery')
        .map((id) => ({
          id,
          title: id.replace(/-/g, ' ').toUpperCase(),
          subtitle: '',
          count: products.filter((p) => p.sport === 'football' && p.category === id).length,
        }));
    }

    const totalFootballCount = products.filter((p) => p.sport === 'football').length;
    return [
      {
        id: 'all',
        title: 'ALL JERSEYS',
        subtitle: 'Explore our complete authentic football jersey collection.',
        count: totalFootballCount,
      },
      ...cats,
    ];
  }, [products, categories, getCategoriesBySport]);

  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (
      footballCategories.length > 0 &&
      !footballCategories.some((c) => c.id === activeCategory)
    ) {
      setActiveCategory('all');
    }
  }, [footballCategories, activeCategory]);

  const footballProducts = products.filter((p) => p.sport === 'football');
  const f1Products = products.filter((p) => p.sport === 'f1');
  const cricketProducts = products.filter((p) => p.sport === 'cricket');

  const handleTabClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    // Smoothly scroll to the top of the #shop container so the selected category header & products are in clear view
    const shopElement = document.getElementById('shop');
    if (shopElement) {
      const isMobile = window.innerWidth < 640;
      const headerOffset = isMobile ? 110 : 130;
      const top =
        shopElement.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }, []);

  // Filter sections based on active category
  const displayedCategories = useMemo(() => {
    const rawCategories = footballCategories.filter((c) => c.id !== 'all');
    if (activeCategory === 'all') {
      return rawCategories;
    }
    return rawCategories.filter((c) => c.id === activeCategory);
  }, [footballCategories, activeCategory]);

  const sportCollections: { sport: Sport; items: typeof products }[] = [
    { sport: 'football', items: footballProducts },
    { sport: 'f1', items: f1Products },
    { sport: 'cricket', items: cricketProducts },
  ];

  return (
    <>
      <HeroSection />
      <CatalogStatus loading={loading} error={error} />

      {sportCollections.map(({ sport, items }) => (
        <SportCollectionSection key={sport} sport={sport} products={items} />
      ))}

      <div id="shop">
        {!loading && footballCategories.length > 0 && (
          <>
            <CategoryTabs
              categories={footballCategories}
              activeSection={activeCategory}
              onTabClick={handleTabClick}
            />
            {displayedCategories.map((category) => (
              <ProductSection key={category.id} category={category} />
            ))}
          </>
        )}
      </div>

      <TrustBadges />
    </>
  );
}
