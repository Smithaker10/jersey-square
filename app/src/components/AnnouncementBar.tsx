import { useScrollDirection } from '@/hooks/useScrollDirection';
import { Instagram, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function AnnouncementBar() {
  const { scrollDirection, scrollY } = useScrollDirection();
  const isHidden = scrollDirection === 'down' && scrollY > 100;

  const highlights = [
    'USE CODE CHINKY100 FOR EXTRA 5% OFF',
    'ALL INDIA SHIPPING',
    'FOOTBALL',
    'CRICKET',
    'FORMULA 1',
    'PLAYER VERSIONS',
    'FAN VERSION',
    'RETRO EDITIONS',
    'MASTER FINISHING',
    'LIMITED ANIME KITS',
    'PREMIUM QUALITY',
  ];
  const marqueeText = [...highlights, ...highlights, ...highlights, ...highlights].join(' \u2022 ');

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] text-white transition-transform duration-300"
      style={{
        transform: isHidden ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      <div className="flex items-center h-9 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <div className="marquee whitespace-nowrap">
            <span className="text-xs font-semibold tracking-[2px] inline-block">
              {marqueeText}
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 px-4 shrink-0">
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity"
          >
            <Instagram size={14} />
            FOLLOW US
          </a>
          <a
            href={siteConfig.whatsappGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity"
          >
            <MessageCircle size={14} />
            JOIN GROUP
          </a>
        </div>
      </div>
    </div>
  );
}
