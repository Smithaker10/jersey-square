import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Eye, Heart, ShoppingBag, Star, Check } from 'lucide-react';
import type { JerseyProduct } from '@/types/product';
import { highlightMatch } from '@/lib/search';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { QuickViewModal } from '@/components/products/QuickViewModal';
import { toast } from 'sonner';

interface ProductCardProps {
  product: JerseyProduct;
  highlightQuery?: string;
}

export function ProductCard({ product, highlightQuery }: ProductCardProps) {
  const [quickView, setQuickView] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);
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

  // Amazon-style deterministic rating & reviews
  const ratingScore = (4.5 + ((product.id * 7) % 5) * 0.1).toFixed(1);
  const ratingCount = 35 + ((product.id * 23) % 240);

  const [hovered, setHovered] = useState(false);

  const handleMobileAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 'M');
    setAddedAnim(true);
    toast.success(`Added ${product.title.split(' ')[0]} to cart`);
    setTimeout(() => setAddedAnim(false), 1500);
  };

  return (
    <>
      <motion.article
        layout
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
        }}
        animate={{
          y: hovered ? -3 : 0,
          boxShadow: hovered
            ? '0 16px 36px rgba(0,0,0,0.1)'
            : '0 1px 4px rgba(0,0,0,0.04)',
          borderColor: hovered ? 'rgba(27,42,74,0.18)' : 'rgba(0,0,0,0.08)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-lg bg-white border border-gray-200/80 transition-all duration-300 sm:rounded-xl sm:border-gray-100"
      >
        <Link to={`/product/${product.id}`} className="flex flex-1 flex-col">
          {/* Product Image Frame: square on mobile, 3/4 on desktop */}
          <div className="relative aspect-square overflow-hidden bg-gray-50/70 flex items-center justify-center p-2 sm:aspect-[3/4] sm:p-4">
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

            {/* Discount Badge */}
            {discountText && (
              <span className="absolute left-1.5 top-1.5 rounded bg-[#CC0C39] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
                {discountText}
              </span>
            )}

            {/* Wishlist Button */}
            <div className="absolute right-1.5 top-1.5 flex flex-col gap-1.5 sm:right-3 sm:top-3 sm:gap-2 sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover:opacity-100">
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle(product.id);
                }}
                className={`rounded-full p-1.5 shadow-xs transition-colors sm:p-2 sm:shadow-md ${
                  wished ? 'bg-[#E53935] text-white' : 'bg-white/90 text-[#1a1a1a] hover:bg-white'
                }`}
                aria-label="Wishlist"
              >
                <Heart size={13} className={`sm:h-4 sm:w-4 ${wished ? 'fill-current' : ''}`} />
              </motion.button>
            </div>

            {/* Desktop Hover Slide-Up Actions */}
            <div className="hidden sm:flex absolute inset-x-0 bottom-0 translate-y-full gap-2 p-3 transition-transform duration-300 group-hover:translate-y-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setQuickView(true);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/95 py-2 text-xs font-semibold text-[#1a1a1a] backdrop-blur-sm hover:bg-white"
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
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1B2A4A] py-2 text-xs font-semibold text-white hover:bg-[#253961]"
              >
                <ShoppingBag size={14} />
                Add to cart
              </button>
            </div>
          </div>

          {/* Amazon-style Card Content */}
          <div className="flex flex-1 flex-col justify-between p-2 sm:p-4">
            <div>
              {/* Category / Team Tag */}
              <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400 block truncate sm:text-[11px]">
                {product.team ? product.team : product.sport} · {product.categoryLabel}
              </span>

              {/* Title */}
              <h3
                className="mt-0.5 line-clamp-2 text-xs font-normal leading-snug text-[#1a1a1a] sm:mt-1 sm:text-sm sm:font-medium sm:min-h-[2.6em]"
                dangerouslySetInnerHTML={{
                  __html: highlightQuery
                    ? highlightMatch(product.title, highlightQuery)
                    : product.title,
                }}
              />

              {/* Amazon-style Rating Stars */}
              <div className="mt-1 flex items-center gap-1">
                <div className="flex items-center text-[#FFA41C]">
                  <Star size={11} className="fill-[#FFA41C] text-[#FFA41C]" />
                </div>
                <span className="text-[11px] font-semibold text-gray-800">{ratingScore}</span>
                <span className="text-[10px] text-gray-400">({ratingCount})</span>
              </div>
            </div>

            {/* Price & Delivery Section */}
            <div className="mt-1.5">
              <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
                <span className="text-sm font-bold text-[#1a1a1a] sm:text-base">
                  ₹{displayPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-400 line-through sm:text-xs">
                  ₹{displayOldPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-semibold text-[#CC0C39] sm:text-xs">
                  ({discountText})
                </span>
              </div>

              {/* Free delivery badge - Amazon signature */}
              <div className="mt-0.5 text-[9px] font-medium text-emerald-700 sm:text-[11px]">
                FREE Delivery by JerseySquare
              </div>
            </div>
          </div>
        </Link>

        {/* Mobile Amazon-style Add to Cart Button */}
        <div className="px-2 pb-2 sm:hidden">
          <button
            type="button"
            onClick={handleMobileAddToCart}
            className={`flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
              addedAnim
                ? 'bg-emerald-600 text-white'
                : 'bg-[#1B2A4A] text-white hover:bg-[#253961]'
            }`}
            aria-label="Add to cart"
          >
            {addedAnim ? (
              <>
                <Check size={12} />
                Added to cart
              </>
            ) : (
              <>
                <ShoppingBag size={12} />
                Add to cart
              </>
            )}
          </button>
        </div>
      </motion.article>

      <QuickViewModal product={quickView ? product : null} onClose={() => setQuickView(false)} />
    </>
  );
}
