import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Instagram, MessageCircle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { siteConfig } from '@/config/site';

const STAGES: Stage[] = ['video', 'jersey', 'cricket'];
const AUTO_INTERVAL = 10000;

type Stage = 'video' | 'jersey' | 'cricket';

const stageConfig: Record<Stage, { src: string; alt: string; label: string; link: string }> = {
  video:   { src: '/hero.mp4',  alt: 'JerseySquare cinematic hero', label: 'Explore F1',       link: '/f1' },
  jersey:  { src: '/herojersey.webp', alt: 'Jersey collection',     label: 'Explore Football', link: '/football' },
  cricket: { src: '/cricket.webp',    alt: 'Cricket collection',    label: 'Explore Cricket',  link: '/cricket' },
};

// ── Magnetic Button Wrapper ───────────────────────────────────────────
function MagneticButton({ children, to, className }: { children: React.ReactNode; to: string; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const x = clientX - centerX;
    const y = clientY - centerY;
    // Shift slightly towards mouse
    setPosition({ x: x * 0.35, y: y * 0.35 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      <Link to={to} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState<Stage>('video');
  const autoRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Mouse move parallax state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize values between -1 and 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Dynamic Scroll Parallax Values
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']); // Moves content up on scroll
  const contentScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.94]); // Subtle scale-down
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.15]); // Fade content
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.8], [0.35, 0.2]); // Lighten overlay on scroll

  const scheduleAuto = useCallback(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    autoRef.current = setTimeout(() => {
      setStage((prev) => {
        const idx = STAGES.indexOf(prev);
        return STAGES[(idx + 1) % STAGES.length];
      });
    }, AUTO_INTERVAL);
  }, []);

  const goTo = useCallback((s: Stage) => {
    setStage(s);
    scheduleAuto();
  }, [scheduleAuto]);

  const goNext = useCallback(() => {
    const idx = STAGES.indexOf(stage);
    goTo(STAGES[(idx + 1) % STAGES.length]);
  }, [stage, goTo]);

  const goPrev = useCallback(() => {
    const idx = STAGES.indexOf(stage);
    goTo(STAGES[(idx - 1 + STAGES.length) % STAGES.length]);
  }, [stage, goTo]);

  useEffect(() => {
    scheduleAuto();

    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [scheduleAuto]);

  const config = stageConfig[stage];
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stage === 'video') {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [stage]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full h-screen min-h-[600px] overflow-hidden bg-black"
    >
      {/* Outer wrapper for mouse move parallax */}
      <motion.div
        className="absolute inset-0 w-full h-full pointer-events-none"
        animate={{
          x: mousePos.x * 8,
          y: mousePos.y * 8,
        }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.8 }}
      >
        {/* Layer 1: Formula 1 Video (Desktop) & Ultra-sharp Portrait Visual (Mobile) */}
        <motion.div
          style={{ y: videoY }}
          className="absolute inset-0 w-full h-full overflow-hidden"
          initial={false}
          animate={{
            opacity: stage === 'video' ? 1 : 0,
            scale: stage === 'video' ? 1 : 1.05,
          }}
          transition={{
            opacity: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: 6, ease: 'easeOut' },
          }}
        >
          {/* Mobile: Ultra-sharp 9:16 Portrait Visual - zero lag, instant load, retina crisp */}
          <div className="block sm:hidden h-full w-full relative">
            <img
              src="/hero-mobile.webp"
              alt="JerseySquare authentic sportswear collection"
              className="h-[115%] w-full object-cover object-center"
              loading="eager"
              fetchPriority="high"
            />
          </div>

          {/* Desktop: High definition widescreen video */}
          <div className="hidden sm:block h-full w-full">
            <video
              ref={videoRef}
              className="h-[115%] w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster="/hero-bg.jpg"
              aria-label="JerseySquare cinematic hero"
            >
              <source src="/hero.mp4" type="video/mp4" />
            </video>
          </div>
        </motion.div>

        {/* Layer 2: Football Jersey Collection */}
        <motion.div
          style={{ y: imageY }}
          className="absolute inset-0 w-full h-full overflow-hidden"
          initial={false}
          animate={{
            opacity: stage === 'jersey' ? 1 : 0,
            scale: stage === 'jersey' ? 1 : 1.05,
          }}
          transition={{
            opacity: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: 6, ease: 'easeOut' },
          }}
        >
          <img
            src="/herojersey.webp"
            alt="Football Jersey collection"
            className="h-[115%] w-full object-cover"
            loading="eager"
          />
        </motion.div>

        {/* Layer 3: Cricket Jersey Collection */}
        <motion.div
          style={{ y: imageY }}
          className="absolute inset-0 w-full h-full overflow-hidden"
          initial={false}
          animate={{
            opacity: stage === 'cricket' ? 1 : 0,
            scale: stage === 'cricket' ? 1 : 1.05,
          }}
          transition={{
            opacity: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: 6, ease: 'easeOut' },
          }}
        >
          <img
            src="/cricket.webp"
            alt="Cricket Jersey collection"
            className="h-[115%] w-full object-cover"
            loading="eager"
          />
        </motion.div>
      </motion.div>

      {/* Dynamic dark overlay */}
      <motion.div
        className="absolute inset-0 bg-black z-[1]"
        style={{ opacity: overlayOpacity }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/50 z-[2]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1B2A4A]/30 to-transparent z-[2]" />

      {/* Decorative ambient blurred blobs - hidden on mobile to prevent GPU lag */}
      <motion.div
        className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl hidden sm:block"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-20 bottom-1/4 h-48 w-48 rounded-full bg-[#1B2A4A]/20 blur-3xl hidden sm:block"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        style={{ y: contentY, scale: contentScale, opacity: contentOpacity }}
        className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4 pb-28 pt-[85px] sm:pb-36 sm:pt-[120px] text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mb-3 sm:mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-white/80 sm:text-sm"
        >
          Premium Sportswear
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="mb-4 sm:mb-6 text-center text-4xl font-black tracking-tight text-white sm:text-7xl lg:text-[6.5rem] xl:text-[7rem] leading-none uppercase"
        >
          {siteConfig.brandNameDisplay}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mb-6 sm:mb-10 max-w-[90%] sm:max-w-[600px] text-center text-xs text-white/80 sm:text-base md:text-lg leading-relaxed"
        >
          Football · Formula 1 · Cricket — authentic jerseys, crafted for fans who demand more.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8 sm:mb-12 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4"
        >
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/30 bg-white/5 px-4 py-2 sm:px-6 sm:py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/15"
          >
            <Instagram size={13} />
            Instagram
          </a>
          <a
            href={siteConfig.whatsappGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/30 bg-white/5 px-4 py-2 sm:px-6 sm:py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/15"
          >
            <MessageCircle size={13} />
            WhatsApp
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="flex flex-row items-center justify-center gap-3 sm:gap-8"
        >
          <MagneticButton
            to="/football"
            className="inline-flex h-11 sm:h-14 items-center justify-center gap-2 sm:gap-3 rounded-full bg-white px-5 sm:px-8 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1a1a1a] shadow-xl shadow-black/25 transition-all hover:bg-white/95"
          >
            SHOP NOW
            <ArrowRight size={14} />
          </MagneticButton>
          <MagneticButton
            to={config.link}
            className="inline-flex h-11 sm:h-14 items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-white/40 bg-white/5 px-5 sm:px-8 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/15"
          >
            {config.label}
          </MagneticButton>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: [0.5, 1, 0.5], y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 cursor-pointer flex flex-col items-center gap-1 z-20 text-white/50 hover:text-white/80 transition-colors"
          onClick={() => {
            const nextSec = document.getElementById('hero')?.nextElementSibling;
            if (nextSec) {
              nextSec.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <span className="text-[9px] uppercase tracking-[0.25em] font-semibold">Scroll</span>
          <ChevronDown size={14} />
        </motion.div>

        {/* Carousel Controls */}
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={goPrev}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => goTo(s)}
                className={`h-2 rounded-full transition-all ${
                  s === stage ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to ${s}`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
