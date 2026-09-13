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
    const fromDb = getCategoriesBySport('football');
    if (fromDb.length > 0) {
      return fromDb
        .filter((cat) =>
          products.some((p) => p.sport === 'football' && p.category === cat.id),
        )
        .filter((cat) => cat.id !== 'indian-embroidery')
        .map((c) => ({ id: c.id, title: c.title, subtitle: c.subtitle }));
    }
    const ids = [
      ...new Set(
        products.filter((p) => p.sport === 'football').map((p) => p.category),
      ),
    ];
    return ids.map((id) => ({
      id,
      title: id.replace(/-/g, ' ').toUpperCase(),
      subtitle: '',
    })).filter((cat) => cat.id !== 'indian-embroidery');
  }, [products, categories, getCategoriesBySport]);

  const [activeSection, setActiveSection] = useState(
    footballCategories[0]?.id ?? 'player-version',
  );

  useEffect(() => {
    if (
      footballCategories.length > 0 &&
      !footballCategories.some((c) => c.id === activeSection)
    ) {
      setActiveSection(footballCategories[0].id);
    }
  }, [footballCategories, activeSection]);

  const footballProducts = products.filter((p) => p.sport === 'football');
  const f1Products = products.filter((p) => p.sport === 'f1');
  const cricketProducts = products.filter((p) => p.sport === 'cricket');

  const handleTabClick = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (!element) return;
    const isMobile = window.innerWidth < 640;
    const headerOffset = isMobile ? 125 : 155;
    const top =
      element.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  // Automatically update active tab when scrolling through sections
  useEffect(() => {
    if (footballCategories.length === 0) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const headerOffset = isMobile ? 130 : 160;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: `-${headerOffset}px 0px -45% 0px`,
        threshold: [0, 0.1, 0.25, 0.5],
      },
    );

    footballCategories.forEach((cat) => {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [footballCategories]);

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
              activeSection={activeSection}
              onTabClick={handleTabClick}
            />
            {footballCategories.map((category) => (
              <ProductSection key={category.id} category={category} />
            ))}
          </>
        )}
      </div>

      <TrustBadges />
    </>
  );
}
