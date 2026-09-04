interface SectionHeaderProps {
  title: string;
  subtitle: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="bg-[#1B2A4A] rounded-xl px-6 sm:px-8 py-6">
      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
        {title}
      </h2>
      <p className="text-[13px] text-white/70 uppercase tracking-[1.5px] mt-2">
        {subtitle}
      </p>
    </div>
  );
}
