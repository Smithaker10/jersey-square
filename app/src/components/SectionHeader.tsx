interface SectionHeaderProps {
  title: string;
  subtitle: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="bg-[#1B2A4A] rounded-xl px-4 sm:px-8 py-3.5 sm:py-6 shadow-xs">
      <h2 className="text-base sm:text-2xl font-extrabold text-white tracking-wide">
        {title}
      </h2>
      <p className="text-[10px] sm:text-[13px] text-white/70 uppercase tracking-[1.2px] sm:tracking-[1.5px] mt-1 sm:mt-2">
        {subtitle}
      </p>
    </div>
  );
}
