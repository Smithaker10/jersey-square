import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { siteConfig } from '@/config/site';

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const ctx = gsap.context(() => {
      gsap.from(footer, {
        scrollTrigger: {
          trigger: footer,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
      });
    }, footer);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      id="contact"
      ref={footerRef}
      className="bg-[#1a1a1a] text-white py-10 sm:py-12"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
          <img
            src="/logo.jpg"
            alt={siteConfig.brandName}
            className="h-10 w-10 rounded-full object-cover border border-white/20 shadow-md"
          />
          <span className="text-lg font-black tracking-wide text-white">
            {siteConfig.brandNameDisplay}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
          {/* Contact Us */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">
              CONTACT US
            </h3>
            <p className="text-sm text-white/80 mb-2">{siteConfig.phone}</p>
            <p className="text-sm text-white/80 mb-3">{siteConfig.email}</p>
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white underline hover:text-white/80 transition-colors"
            >
              Chat on WhatsApp
            </a>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">
              LEGAL
            </h3>
            <button className="text-sm text-white underline hover:text-white/80 transition-colors">
              Our Policies
            </button>
          </div>

          {/* Social + Copyright */}
          <div className="sm:text-right">
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/80 hover:text-white transition-colors block mb-4"
            >
              Follow us on Instagram {siteConfig.instagramHandle}
            </a>
            <p className="text-xs text-white/50">
              © 2026 {siteConfig.brandName}. {siteConfig.tagline}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
