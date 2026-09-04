import { Shield, Truck, BadgeCheck, Headset } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const badges = [
  {
    icon: Shield,
    label: 'PREMIUM QUALITY',
  },
  {
    icon: Truck,
    label: 'FAST DELIVERY',
  },
  {
    icon: BadgeCheck,
    label: 'TRUSTED SHOP',
  },
  {
    icon: Headset,
    label: 'DIRECT SUPPORT',
  },
];

export function TrustBadges() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const items = container.querySelectorAll('.badge-item');
      gsap.from(items, {
        scrollTrigger: {
          trigger: container,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.15,
        ease: 'power2.out',
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section className="bg-white border-t border-gray-200 py-12 sm:py-16">
      <div
        ref={containerRef}
        className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {badges.map((badge) => (
            <div
              key={badge.label}
              className="badge-item flex flex-col items-center text-center gap-4"
            >
              <badge.icon size={32} className="text-[#1B2A4A]" strokeWidth={1.5} />
              <span className="text-[13px] font-semibold text-[#1a1a1a] uppercase tracking-wider">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
