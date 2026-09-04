import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ArrowLeft, Instagram, MessageCircle, CheckCircle } from 'lucide-react';
import { getSportConfig } from '@/config/sports';
import { siteConfig } from '@/config/site';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCatalogStore } from '@/store/catalogStore';
import { ProductImageZoom } from '@/components/products/ProductImageZoom';
import { CatalogStatus } from '@/components/catalog/CatalogStatus';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const products = useCatalogStore((s) => s.products);
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);
  const product = products.find((p) => p.id === Number(id));
  const addItem = useCartStore((s) => s.addItem);
  const { has, toggle } = useWishlistStore();

  const [selectedSize, setSelectedSize] = useState('M');
  const [showToast, setShowToast] = useState(false);

  // Track recently viewed
  useEffect(() => {
    if (product) {
      try {
        const recent = JSON.parse(localStorage.getItem('jerseysquare-recent') || '[]');
        const updated = [product.id, ...recent.filter((rid: number) => rid !== product.id)].slice(0, 10);
        localStorage.setItem('jerseysquare-recent', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
    }
  }, [product]);

  if (loading) {
    return (
      <div className="pt-[100px]">
        <CatalogStatus loading />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center pt-[100px]">
        <CatalogStatus error={error} />
        <p className="text-lg font-semibold">Product not found</p>
        <Link to="/" className="mt-4 text-sm text-[#1B2A4A] underline">
          Back to home
        </Link>
      </div>
    );
  }

  const sportConfig = getSportConfig(product.sport);
  const wished = has(product.id);
  const instagramInquiryMessage = encodeURIComponent(
    `Hi JerseySquare, I’m interested in ${product.title} in Size ${selectedSize} (${sportConfig.label} · ${product.categoryLabel}). Please reply with availability details.`,
  );

  return (
    <div className="pt-[100px] relative">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to={sportConfig.path}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a1a1a]"
        >
          <ArrowLeft size={16} />
          Back to {sportConfig.label}
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="cursor-zoom-in lg:sticky lg:top-[120px] lg:self-start"
          >
            <ProductImageZoom src={product.image} alt={product.title} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {product.sport.toUpperCase()} · {product.categoryLabel}
            </span>
            <h1 className="mt-2 text-2xl font-bold text-[#1a1a1a] sm:text-3xl">
              {product.title}
            </h1>
            <p className="mt-2 text-gray-600">
              {product.team}
              {product.player ? ` · ${product.player}` : ''}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>

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
                <div className="mt-6 flex items-center gap-3">
                  <span className="text-3xl font-bold">₹{displayPrice.toLocaleString('en-IN')}</span>
                  <span className="text-lg text-gray-400 line-through">
                    ₹{displayOldPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="rounded bg-[#E53935] px-2.5 py-1 text-xs font-semibold text-white">
                    {discountText}
                  </span>
                </div>
              );
            })()}

            {/* Size Selector */}
            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-400">
                <span>Select Size Fit</span>
              </div>
              <div className="flex gap-2">
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-black transition-all ${
                      selectedSize === sz
                        ? 'border-[#1B2A4A] bg-[#1B2A4A] text-white shadow-md'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  addItem(product, selectedSize);
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1B2A4A] px-8 py-4 text-sm font-semibold text-white sm:flex-none"
              >
                <ShoppingBag size={18} />
                Add to cart
              </button>
              <button
                type="button"
                onClick={async () => {
                  await addItem(product, selectedSize);
                  navigate('/cart');
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-sm font-semibold text-white sm:flex-none"
              >
                Buy Now
              </button>
              <button
                type="button"
                onClick={() => toggle(product.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-4 text-sm font-semibold ${
                  wished ? 'border-[#E53935] text-[#E53935]' : 'border-gray-200'
                }`}
              >
                <Heart size={18} className={wished ? 'fill-current' : ''} />
                Wishlist
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <motion.a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Instagram"
                title={`Enquire about ${product.title} on Instagram`}
                className="group inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-[0_10px_24px_rgba(221,42,123,0.28)] ring-1 ring-black/5"
                whileHover={{ rotate: 12, scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
              >
                <motion.span
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex"
                >
                  <Instagram size={24} strokeWidth={2} />
                </motion.span>
              </motion.a>
              <motion.a
                href={`${siteConfig.whatsappUrl}?text=${instagramInquiryMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open WhatsApp"
                title={`Message about ${product.title} on WhatsApp`}
                className="group inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] via-[#1faa59] to-[#128C7E] text-white shadow-[0_10px_24px_rgba(37,211,102,0.28)] ring-1 ring-black/5"
                whileHover={{ rotate: -12, scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex"
                >
                  <MessageCircle size={24} strokeWidth={2} />
                </motion.span>
              </motion.a>
            </div>

            <p className="mt-8 text-sm leading-relaxed text-gray-500">
              Premium quality jersey from JerseySquare. All India shipping available.
              Contact us on WhatsApp for sizing help and bulk orders.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Cart Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Added to Cart!</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {product.title} (Size {selectedSize})
              </p>
            </div>
            <Link
              to="/cart"
              className="ml-4 rounded-lg bg-[#1B2A4A] px-3.5 py-2 text-xs font-semibold text-white hover:brightness-110"
            >
              View Cart
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
