interface BrandProps {
  compact?: boolean;
  inverse?: boolean;
}

export function Brand({ compact = false, inverse = false }: BrandProps) {
  return (
    <div className={`flex items-center gap-3 ${inverse ? "text-white" : "text-navy"}`}>
      <img alt="Cevichería Periquito" className={`shrink-0 rounded-full object-contain ${compact ? "size-10" : "size-12"}`} src="/logo-periquito.png" />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-extrabold tracking-[0.04em]">PERIQUITO</span>
          <span className={`mt-1 block text-[9px] font-bold tracking-[0.14em] ${inverse ? "text-white/65" : "text-slate-500"}`}>
            CEVICHERÍA · GESTIÓN
          </span>
        </span>
      )}
    </div>
  );
}
