import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router';
import type { JerseyProduct } from '@/types/product';
import { useCartStore } from '@/store/cartStore';

interface QuickViewModalProps {
  product: JerseyProduct | null;
  onClose: () => void;
}

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [selectedSize, setSelectedSize] = useState('M');

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <img
              src={product.image}
              alt={product.title}
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="p-6">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                {product.sport.toUpperCase()} · {product.categoryLabel}
              </span>
              <h2 className="mt-1 text-lg font-semibold text-[#1a1a1a]">
                {product.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {product.team}
                {product.player ? ` · ${product.player}` : ''}
              </p>
              
              {(() => {
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
                return (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xl font-bold">₹{displayPrice.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-gray-400 line-through">
                      ₹{displayOldPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="rounded bg-[#E53935] px-2 py-0.5 text-[11px] font-semibold text-white">
                      {discountText}
                    </span>
                  </div>
                );
              })()}

              {/* Size Fit Selector */}
              <div className="mt-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Select Size
                </span>
                <div className="flex gap-2">
                  {SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                        selectedSize === sz
                          ? 'border-[#1B2A4A] bg-[#1B2A4A] text-white shadow'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addItem(product, selectedSize);
                    onClose();
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1B2A4A] py-3 text-sm font-semibold text-white"
                >
                  <ShoppingBag size={16} />
                  Add to cart
                </button>
                <Link
                  to={`/product/${product.id}`}
                  onClick={onClose}
                  className="flex items-center justify-center rounded-full border border-gray-200 px-5 py-3 text-sm font-medium"
                >
                  Details
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
