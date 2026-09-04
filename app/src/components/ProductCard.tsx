import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import type { JerseyProduct } from '@/types/product';
import { highlightMatch } from '@/lib/search';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { QuickViewModal } from '@/components/products/QuickViewModal';

interface ProductCardProps {
  product: JerseyProduct;
  highlightQuery?: string;
}

export function ProductCard({ product, highlightQuery }: ProductCardProps) {
  const [quickView, setQuickView] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { has, toggle } = useWishlistStore();
  const wished = has(product.id);

  const isF1OrCricket = product.sport === 'f1' || product.sport === 'cricket';
  const isMaster = product.category === 'master-version';
  const isPlayer = product.category === 'player-version';
  const displayPrice = isF1OrCricket
    ? 1099
    : (isMaster ? 799 : (isPlayer ? 1299 : product.price));
  const displayOldPrice = isF1OrCricket
    ? 1399
    : (isMaster
      ? 1099
      : (isPlayer
        ? 1599
        : product.oldPrice > displayPrice
          ? product.oldPrice
          : displayPrice + 300));
  const discountText =
    product.discount && product.discount !== '' && product.discount !== '-0%'
      ? product.discount
      : `-${Math.round(((displayOldPrice - displayPrice) / displayOldPrice) * 100)}%`;

  const [hovered, setHovered] = useState(false);

  return (
    <>
      <motion.article
        layout
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        variants={{
          hidden: { opacity: 0, y: 24 },
          show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        }}
        animate={{
          y: hovered ? -3 : 0,
          boxShadow: hovered
            ? '0 16px 36px rgba(0,0,0,0.1)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          borderColor: hovered ? 'rgba(27,42,74,0.15)' : 'rgba(0,0,0,0.06)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 transition-all duration-300"
      >
        <Link to={`/product/${product.id}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 flex items-center justify-center p-4">
            <motion.img
              src={product.image}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-contain"
              animate={{
                scale: hovered ? 1.08 : 1,
                rotate: hovered ? 1.5 : 0,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
            {discountText && (
              <span className="absolute left-3 top-3 rounded bg-[#E53935] px-2.5 py-1 text-[11px] font-semibold text-white">
                {discountText}
              </span>
            )}

            <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  toggle(product.id);
                }}
                className={`rounded-full p-2 shadow-md backdrop-blur-md ${
                  wished ? 'bg-[#E53935] text-white' : 'bg-white/90 text-[#1a1a1a]'
                }`}
                aria-label="Wishlist"
              >
                <Heart size={16} className={wished ? 'fill-current' : ''} />
              </motion.button>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-2 p-3 transition-transform duration-300 group-hover:translate-y-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setQuickView(true);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/95 py-2.5 text-xs font-semibold text-[#1a1a1a] backdrop-blur-sm"
              >
                <Eye size={14} />
                Quick view
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  addItem(product, 'M');
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1B2A4A] py-2.5 text-xs font-semibold text-white"
              >
                <ShoppingBag size={14} />
                Add to cart
              </button>
            </div>
          </div>
        </Link>

        <div className="p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            {product.sport.toUpperCase()} · {product.categoryLabel}
          </span>
          <h3
            className="mt-1 line-clamp-2 min-h-[2.6em] text-sm font-medium leading-snug text-[#1a1a1a]"
            dangerouslySetInnerHTML={{
              __html: highlightQuery
                ? highlightMatch(product.title, highlightQuery)
                : product.title,
            }}
          />
          <motion.div
            animate={{ y: hovered ? -2 : 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 flex items-center gap-2"
          >
            <span className="text-base font-bold text-[#1a1a1a]">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-sm text-gray-400 line-through">
              ₹{displayOldPrice.toLocaleString('en-IN')}
            </span>
          </motion.div>
        </div>
      </motion.article>

      <QuickViewModal product={quickView ? product : null} onClose={() => setQuickView(false)} />
    </>
  );
}
