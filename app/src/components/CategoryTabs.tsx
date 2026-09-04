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
      className="sticky top-[100px] z-30 border-b border-black/5 bg-[#EDE8E0]"
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
                className={`min-w-[140px] shrink-0 snap-center flex-1 border-r border-black/5 px-4 py-6 text-center text-sm font-bold uppercase tracking-wide transition-all duration-300 last:border-r-0 whitespace-pre-line ${
                  isActive
                    ? 'bg-[#1B2A4A] text-white'
                    : 'bg-white text-[#1a1a1a] hover:bg-gray-50'
                }`}
              >
                {cat.title.replace(' ', '\n')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
