import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowRight } from 'lucide-react';
import type { JerseyProduct, Sport } from '@/types/product';
import { getSportConfig } from '@/config/sports';
import { ProductCard } from '@/components/ProductCard';

interface SportCollectionSectionProps {
  sport: Sport;
  products: JerseyProduct[];
}

const bgImages: Record<Sport, string> = {
  football: '/foot-bg.png',
  f1: '/f1-bg.png',
  cricket: '/cric-bg.png',
};

const accentColors: Record<Sport, string> = {
  football: '#43D854',
  f1: '#FF3B30',
  cricket: '#3B82F6',
};

const subtitles: Record<Sport, string> = {
  football: 'Club, National & Retro Jerseys. Worn with pride. Made for legends.',
  f1: 'Race-inspired apparel & paddock essentials. Performance. Precision. Passion.',
  cricket: 'Official-inspired cricket jerseys. Real passion. For the game we live for.',
};

export function SportCollectionSection({ sport, products }: SportCollectionSectionProps) {
  const config = getSportConfig(sport);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: '-100px' });
  const items = products.slice(0, 8);
  const hero = items[0];
  const rest = items.slice(1);
  const accent = accentColors[sport];

  // Featured card hover state
  const [cardHover, setCardHover] = useState(false);

  // Parallax on the giant faded text background
  const { scrollYProgress: sectionScrollY } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });
  const textX = useTransform(sectionScrollY, [0, 1], ['-8%', '-2%']); // Subtle horizontal slide

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: dir === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  const titleLetters = config.label.split('');

  return (
    <section ref={sectionRef} className="relative z-0">
      <div
        className="relative overflow-hidden isolate"
        style={{ height: 'clamp(320px, 48vh, 600px)' }}
      >
        {/* Stadium background with ultra-slow Ken Burns loop */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div
            animate={inView ? {
              scale: [1.02, 1.12, 1.02],
            } : { scale: 1.02 }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="h-full w-full"
            style={{
              backgroundImage: `url(${bgImages[sport]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: `linear-gradient(90deg, rgba(0,0,0,.92) 0%, rgba(0,0,0,.75) 30%, rgba(0,0,0,.18) 65%, rgba(0,0,0,.05) 100%)`,
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-black/10"
        />

        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            height: '60px',
            bottom: 0,
            top: 'auto',
            background: `linear-gradient(180deg, transparent, rgba(248,246,242,1))`,
          }}
        />

        {/* Faded Background Text with Horizontal Scroll Parallax */}
        <motion.div
          style={{ x: textX, opacity: inView ? 1 : 0 }}
          transition={{ duration: 1.5 }}
          className="pointer-events-none absolute left-0 top-0 z-[2] select-none"
        >
          <span
            className="block font-black leading-none text-white"
            aria-hidden="true"
            style={{
              fontSize: 'clamp(60px, 14vw, 220px)',
              opacity: 0.015,
              letterSpacing: '3px',
              lineHeight: 0.8,
              filter: 'blur(3px)',
              userSelect: 'none',
            }}
          >
            {config.label.toUpperCase()}
          </span>
        </motion.div>

        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] items-center px-4 sm:px-8 lg:px-[120px] xl:px-[160px]">
          <div className="flex w-full max-w-[520px] flex-col">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mb-2 sm:mb-4 text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.45em]"
              style={{ color: accent }}
            >
              Collection
            </motion.span>

            {/* Split Character/Word Reveal */}
            <h2
              className="font-bold leading-none text-white flex flex-wrap"
              style={{ fontSize: 'clamp(28px, 6vw, 64px)', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
            >
              {titleLetters.map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.6,
                    ease: 'easeOut',
                    delay: 0.1 + index * 0.03
                  }}
                  style={{ display: char === ' ' ? 'inline' : 'inline-block', marginRight: char === ' ' ? '12px' : '0' }}
                >
                  {char}
                </motion.span>
              ))}
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
              className="mt-3 sm:mt-5 max-w-[460px] text-xs sm:text-base md:text-[19px] text-white/95"
              style={{ lineHeight: '1.6', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
            >
              {subtitles[sport]}
            </motion.p>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.35 }}
              className="mt-3 sm:mt-[28px] h-[3px] origin-left rounded-full"
              style={{ width: '60px', backgroundColor: accent }}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-4 sm:mt-6"
            >
              <Link
                to={config.path}
                className="group relative inline-flex items-center gap-2 text-xs sm:text-[15px] font-medium tracking-wide text-white/80 transition-colors hover:text-white"
              >
                <span>View Collection</span>
                <ArrowUpRight
                  size={15}
                  className="transition-all duration-300 group-hover:translate-x-[4px] group-hover:-translate-y-[4px]"
                />
                <span
                  className="absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-500 group-hover:w-full"
                  style={{ backgroundColor: accent }}
                />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="bg-[#F8F6F2]">
        <div
          className="relative mx-auto max-w-[1400px] px-3 sm:px-8 lg:px-[120px] xl:px-[160px]"
          style={{ marginTop: '-24px' }}
        >
          {hero && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 }}
            >
              {/* Premium 3D Tilt Featured Card Hover */}
              <motion.div
                onMouseEnter={() => setCardHover(true)}
                onMouseLeave={() => setCardHover(false)}
                animate={{
                  y: cardHover ? -3 : 0,
                  boxShadow: cardHover
                    ? '0 12px 30px rgba(0,0,0,0.08)'
                    : '0 1px 8px rgba(0,0,0,0.04)',
                  borderColor: cardHover ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="flex items-center justify-between rounded-[14px] sm:rounded-[20px] border bg-white/90 px-3.5 py-2.5 sm:px-6 sm:py-4 backdrop-blur-sm cursor-pointer shadow-xs"
              >
                <Link
                  to={`/product/${hero.id}`}
                  className="group flex items-center gap-3 sm:gap-4"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg sm:h-16 sm:w-16 sm:rounded-xl bg-gray-50 flex items-center justify-center p-1">
                    <motion.img
                      src={hero.image}
                      alt={hero.title}
                      className="h-full w-full object-contain"
                      animate={{ scale: cardHover ? 1.08 : 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                      Featured Collection
                    </p>
                    <h3 className="text-xs sm:text-[15px] font-semibold text-gray-800 transition-colors group-hover:text-gray-600 line-clamp-1">
                      {hero.title}
                    </h3>
                    <p className="text-[11px] sm:text-[12px] font-bold text-gray-500 sm:text-gray-400">
                      ₹{hero.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <Link
                    to={config.path}
                    className="group relative hidden items-center gap-1.5 text-[13px] font-medium tracking-wide text-gray-400 transition-colors hover:text-gray-600 sm:inline-flex"
                  >
                    <span>Explore</span>
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-300"
                      style={{ transform: cardHover ? 'translateX(4px)' : 'translateX(0)' }}
                    />
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gray-400 transition-all duration-500 group-hover:w-full" />
                  </Link>
                  <ArrowRight
                    size={15}
                    className="text-gray-300 transition-transform"
                    style={{ transform: cardHover ? 'translateX(3px)' : 'translateX(0)', color: cardHover ? '#1B2A4A' : '#D1D5DB' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          <div className="relative pb-10 sm:pb-20 pt-4 sm:pt-8">
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 sm:w-16 bg-gradient-to-l from-[#F8F6F2] to-transparent" />

            <div
              ref={scrollRef}
              className="scrollbar-hide flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory sm:gap-6"
            >
              {rest.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  // Staggered cards entrance with premium power4 cubic-bezier
                  transition={{
                    delay: 0.35 + i * 0.06,
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="w-[160px] shrink-0 snap-start sm:w-[260px] md:w-[280px]"
                >
                  <div className="overflow-hidden rounded-[14px] sm:rounded-[18px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow duration-500 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                    <ProductCard product={product} />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 hidden justify-end gap-3 sm:flex">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: `${accent}14`, color: accent }}
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: `${accent}14`, color: accent }}
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
