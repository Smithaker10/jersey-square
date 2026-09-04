import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useCatalogStore } from '@/store/catalogStore';
import { searchProducts } from '@/lib/search';
import { highlightMatch } from '@/lib/search';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { JerseyProduct } from '@/types/product';

interface SearchBarProps {
  variant?: 'header' | 'overlay';
  autoFocus?: boolean;
  onClose?: () => void;
  transparent?: boolean;
}

export function SearchBar({ variant = 'header', autoFocus, onClose, transparent }: SearchBarProps) {
  const navigate = useNavigate();
  const products = useCatalogStore((s) => s.products);
  const searchRemote = useCatalogStore((s) => s.searchRemote);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<JerseyProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    let cancelled = false;
    const q = query.trim();

    if (!q) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);
      return;
    }

    setOpen(true);

    // Instant in-memory search for 0ms latency
    const localResults = searchProducts(products, q);
    if (localResults.length > 0 || products.length > 0 || !isSupabaseConfigured) {
      setSuggestions(localResults.slice(0, 8));
      setActiveIndex(0);
      setSearching(false);
      return;
    }

    // Fallback if products list is not yet loaded in memory
    setSearching(true);
    searchRemote(q)
      .then((results) => {
        if (!cancelled) {
          setSuggestions(results.slice(0, 8));
          setActiveIndex(0);
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, products, searchRemote]);

  const goToSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setOpen(false);
    onClose?.();
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const goToProduct = (id: number) => {
    setOpen(false);
    onClose?.();
    navigate(`/product/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      onClose?.();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (open && suggestions[activeIndex]) {
        goToProduct(suggestions[activeIndex].id);
      } else {
        goToSearch(query);
      }
    }
  };

  const isOverlay = variant === 'overlay';

  return (
    <div className={`relative ${isOverlay ? 'w-full max-w-2xl' : 'w-full max-w-xs'}`}>
      <div
        className={`flex items-center gap-2 rounded-full border transition-all duration-300 ${
          isOverlay
            ? 'border-white/20 bg-white/10 px-5 py-3 backdrop-blur-md'
            : transparent
            ? 'border-white/25 bg-white/10 px-4 py-2 focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/10'
            : 'border-gray-200 bg-gray-50 px-4 py-2 focus-within:border-[#1B2A4A] focus-within:ring-2 focus-within:ring-[#1B2A4A]/10'
        }`}
      >
        <motion.div animate={{ scale: query ? 1.08 : 1 }}>
          {searching ? (
            <Loader2
              size={18}
              className={`animate-spin ${isOverlay || transparent ? 'text-white/70' : 'text-gray-400'}`}
            />
          ) : (
            <Search
              size={18}
              className={isOverlay || transparent ? 'text-white/70' : 'text-gray-400'}
              aria-hidden
            />
          )}
        </motion.div>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions"
          placeholder="Search team, player, sport…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent text-sm outline-none transition-colors ${
            isOverlay || transparent
              ? 'text-white placeholder:text-white/60'
              : 'text-[#1a1a1a] placeholder:text-gray-400'
          }`}
        />
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            id="search-suggestions"
            role="listbox"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-auto rounded-xl border shadow-xl ${
              isOverlay
                ? 'border-white/10 bg-[#1a1a1a]/95 backdrop-blur-xl'
                : 'border-gray-100 bg-white'
            }`}
          >
            {suggestions.map((item, index) => (
              <li key={item.id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goToProduct(item.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                    index === activeIndex
                      ? isOverlay
                        ? 'bg-white/10'
                        : 'bg-gray-50'
                      : ''
                  }`}
                >
                  <img
                    src={item.image}
                    alt=""
                    className="h-12 w-10 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`line-clamp-1 font-medium ${isOverlay ? 'text-white' : 'text-[#1a1a1a]'}`}
                      dangerouslySetInnerHTML={{
                        __html: highlightMatch(item.title, debouncedQuery),
                      }}
                    />
                    <p className={`text-xs ${isOverlay ? 'text-white/50' : 'text-gray-400'}`}>
                      {item.team} · {item.sport.toUpperCase()} · {item.categoryLabel}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold ${isOverlay ? 'text-white' : 'text-[#1a1a1a]'}`}
                  >
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                </button>
              </li>
            ))}
            <li className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={() => goToSearch(query)}
                className={`w-full rounded-lg py-2 text-center text-xs font-semibold ${
                  isOverlay ? 'text-white/80 hover:bg-white/10' : 'text-[#1B2A4A] hover:bg-gray-50'
                }`}
              >
                View all results for &quot;{query}&quot;
              </button>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && !searching && debouncedQuery && suggestions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute left-0 right-0 z-50 mt-2 rounded-xl border p-4 text-center text-sm ${
              isOverlay
                ? 'border-white/10 bg-[#1a1a1a]/95 text-white/70'
                : 'border-gray-100 bg-white text-gray-500'
            }`}
          >
            No products found. Press Enter to search anyway.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
