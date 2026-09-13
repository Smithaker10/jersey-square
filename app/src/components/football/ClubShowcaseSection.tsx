import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

type ClubBadge = {
  name: string;
  logo: string;
  colors: string;
};

type ClubFeature = {
  name: string;
  image: string;
  description: string;
  accent: string;
  link: string;
};

const clubBadges: ClubBadge[] = [
  { name: 'Barcelona', logo: '/fcb.webp', colors: 'from-[#A50044] via-[#004D98] to-[#FDB913]' },
  { name: 'Real Madrid', logo: '/rm.webp', colors: 'from-white via-[#D4AF37] to-[#00529F]' },
  { name: 'Manchester United', logo: '/logos/clubs/manunited.svg', colors: 'from-[#DA291C] via-[#FBE122] to-[#DA291C]' },
  { name: 'AC Milan', logo: '/logos/clubs/acmilan.svg', colors: 'from-[#D71920] via-[#111827] to-[#D71920]' },
  { name: 'Manchester City', logo: '/logos/clubs/mancity.svg', colors: 'from-[#6CABDD] via-white to-[#6CABDD]' },
  { name: 'Liverpool', logo: '/logos/clubs/liverpool.svg', colors: 'from-[#C8102E] via-white to-[#C8102E]' },
  { name: 'Bayern', logo: '/logos/clubs/bayern.svg', colors: 'from-[#DC052D] via-[#0066B1] to-[#DC052D]' },
  { name: 'Arsenal', logo: '/logos/clubs/arsenal.svg', colors: 'from-[#EF0107] via-[#9C824A] to-[#EF0107]' },
  { name: 'Napoli', logo: '/logos/clubs/napoli.png', colors: 'from-[#1B4D9B] via-[#6EC6FF] to-[#1B4D9B]' },
  { name: 'Inter Miami', logo: '/logos/clubs/intermiami.svg', colors: 'from-[#111111] via-[#F7C5D5] to-[#111111]' },
  { name: 'Chelsea', logo: '/logos/clubs/chelsea.svg', colors: 'from-[#034694] via-[#DBA111] to-[#034694]' },
  { name: 'Juventus', logo: '/logos/clubs/juventus.svg', colors: 'from-white via-black to-white' },
  { name: 'Dortmund', logo: '/logos/clubs/dortmund.svg', colors: 'from-[#FDE100] via-black to-[#FDE100]' },
];

const clubFeatures: ClubFeature[] = [
  {
    name: 'FC Barcelona',
    image: '/fcb.webp',
    description: 'Shop the latest Blaugrana drops and limited fan versions.',
    accent: 'from-[#A50044]/85 via-[#004D98]/70 to-black/20',
    link: '/search?q=Barcelona',
  },
  {
    name: 'Real Madrid',
    image: '/rm.webp',
    description: 'Match-ready white kits and premium player editions.',
    accent: 'from-black/80 via-[#3b2f2f]/45 to-[#b08d57]/25',
    link: '/search?q=Real%20Madrid',
  },
];

export function ClubShowcaseSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -340 : 340,
      behavior: 'smooth',
    });
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white py-8 sm:py-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-[#A50044]/5 blur-3xl" />
      <div className="absolute -right-24 bottom-8 h-56 w-56 rounded-full bg-[#1B4D9B]/5 blur-3xl" />

      <div className="relative mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.45em] text-black/45">
            Football
          </p>
          <h2 className="mt-1.5 sm:mt-3 text-2xl font-black tracking-[0.12em] text-black sm:text-5xl">
            SHOP BY CLUB
          </h2>
          <p className="mt-1.5 sm:mt-3 text-xs text-black/65 sm:text-lg">Scroll Right To Explore</p>
        </motion.div>

        <div className="relative mt-6 sm:mt-10">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 sm:w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 sm:w-16 bg-gradient-to-l from-white to-transparent" />

          <div
            ref={scrollRef}
            className="scrollbar-hide flex gap-3 sm:gap-5 overflow-x-auto pb-3 snap-x snap-mandatory"
          >
            {clubBadges.map((club, index) => (
              <motion.div
                key={club.name}
                initial={{ opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="group flex w-[62px] shrink-0 flex-col items-center snap-start sm:w-[86px]"
              >
                <Link
                  to={`/search?q=${encodeURIComponent(club.name)}`}
                  className="flex flex-col items-center"
                >
                  <div className={`flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br ${club.colors} p-[2px] shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.16)]`}>
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white p-2 sm:p-2.5 transition-transform duration-300 group-hover:scale-105">
                      <img
                        src={club.logo}
                        alt={club.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-center text-[9px] font-semibold leading-tight text-black/70 transition-colors group-hover:text-black sm:text-xs">
                    {club.name}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="rounded-full border border-black/10 bg-white p-2 text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-black hover:text-white sm:p-2.5"
              aria-label="Scroll clubs left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="rounded-full border border-black/10 bg-white p-2 text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-black hover:text-white sm:p-2.5"
              aria-label="Scroll clubs right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6 sm:mt-10">
          {clubFeatures.map((club, index) => (
            <motion.article
              key={club.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.1 + index * 0.08 }}
              className="group relative h-[220px] overflow-hidden rounded-[20px] sm:rounded-[28px] bg-[#111827] shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:h-[330px]"
            >
              <img
                src={club.image}
                alt={club.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${club.accent}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

              <div className="relative flex h-full flex-col justify-end p-4 sm:p-8">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-white/65">
                  Club Spotlight
                </p>
                <h3 className="mt-1 sm:mt-2 text-2xl font-black tracking-wide text-white sm:text-4xl">
                  {club.name}
                </h3>
                <p className="mt-2 max-w-md text-xs leading-5 text-white/80 sm:text-base sm:leading-6">
                  {club.description}
                </p>
                <Link
                  to={club.link}
                  className="mt-3 sm:mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:gap-3 sm:px-5 sm:py-3 sm:text-sm"
                >
                  Explore Club
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}