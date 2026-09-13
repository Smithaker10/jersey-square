import { useEffect, useRef } from 'react';
import { useScrollDirection } from '@/hooks/useScrollDirection';

export interface TabCategory {
  id: string;
  title: string;
  count?: number;
}

interface CategoryTabsProps {
  categories: TabCategory[];
  activeSection: string;
  onTabClick: (sectionId: string) => void;
}

export function CategoryTabs({
  categories,
  activeSection,
  onTabClick,
}: CategoryTabsProps) {
  const { scrollDirection, scrollY } = useScrollDirection();
  const isAnnouncementHidden = scrollDirection === 'down' && scrollY > 100;
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll selected tab within its horizontal container ONLY (never scrolls the window)
  useEffect(() => {
    if (containerRef.current && activeTabRef.current) {
      const container = containerRef.current;
      const tab = activeTabRef.current;
      const scrollLeft =
        tab.offsetLeft - container.offsetWidth / 2 + tab.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [activeSection]);

  return (
    <div
      id="categories"
      className="sticky z-30 border-b border-black/5 bg-[#F8F6F2]/95 backdrop-blur-md shadow-xs transition-[top] duration-300 py-2.5 sm:py-3.5"
      style={{ top: isAnnouncementHidden ? '64px' : '100px' }}
    >
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide py-0.5"
        >
          {categories.map((cat) => {
            const isActive = activeSection === cat.id;
            return (
              <button
                key={cat.id}
                ref={isActive ? activeTabRef : null}
                type="button"
                onClick={() => onTabClick(cat.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`group shrink-0 inline-flex items-center justify-center rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-[#1B2A4A] text-white shadow-md shadow-[#1B2A4A]/25 ring-2 ring-[#1B2A4A]/20'
                    : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-[#1a1a1a] border border-gray-200/90 shadow-2xs'
                }`}
              >
                <span>{cat.title}</span>
                {cat.count !== undefined && cat.count > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
