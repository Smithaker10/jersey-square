export interface TabCategory {
  id: string;
  title: string;
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
  return (
    <div
      id="categories"
      className="sticky top-[84px] sm:top-[100px] z-30 border-b border-black/5 bg-[#EDE8E0] shadow-xs"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide">
          {categories.map((cat) => {
            const isActive = activeSection === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onTabClick(cat.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`min-w-[105px] sm:min-w-[140px] shrink-0 snap-center flex-1 border-r border-black/5 px-3 py-3 sm:px-4 sm:py-5 text-center text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 last:border-r-0 whitespace-nowrap sm:whitespace-pre-line ${
                  isActive
                    ? 'bg-[#1B2A4A] text-white shadow-inner'
                    : 'bg-white text-[#1a1a1a] hover:bg-gray-50'
                }`}
              >
                <span className="inline sm:hidden">{cat.title}</span>
                <span className="hidden sm:inline">{cat.title.replace(' ', '\n')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
