import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn } from 'lucide-react';

interface ProductImageZoomProps {
  src: string;
  alt: string;
  zoomScale?: number;
}

export function ProductImageZoom({
  src,
  alt,
  zoomScale = 2.25,
}: ProductImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const updateOrigin = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    setOrigin({ x, y });
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateOrigin(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (touch) updateOrigin(touch.clientX, touch.clientY);
  };

  return (
    <div
      ref={containerRef}
      className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-50"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setOrigin({ x: 50, y: 50 });
      }}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsHovering(true)}
      onTouchEnd={() => {
        setIsHovering(false);
        setOrigin({ x: 50, y: 50 });
      }}
      onTouchMove={handleTouchMove}
    >
      <motion.img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full select-none object-cover will-change-transform"
        animate={{
          scale: isHovering ? zoomScale : 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        style={{
          transformOrigin: `${origin.x}% ${origin.y}%`,
        }}
      />

      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent transition-opacity duration-300 ${
          isHovering ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <div
        className={`pointer-events-none absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#1a1a1a] shadow-sm backdrop-blur-sm transition-all duration-300 md:bottom-5 md:left-5 ${
          isHovering ? 'translate-y-2 opacity-0' : 'opacity-100'
        }`}
      >
        <ZoomIn size={14} />
        <span className="hidden sm:inline">Hover to zoom</span>
        <span className="sm:hidden">Pinch or drag to zoom</span>
      </div>
    </div>
  );
}
