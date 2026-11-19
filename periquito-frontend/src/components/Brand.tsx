import { Bird } from "lucide-react";

interface BrandProps {
  compact?: boolean;
  inverse?: boolean;
}

export function Brand({ compact = false, inverse = false }: BrandProps) {
  return (
    <div className={`flex items-center gap-3 ${inverse ? "text-white" : "text-navy"}`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal text-white shadow-sm">
        <Bird size={23} strokeWidth={2.2} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-black tracking-[0.14em]">PERIQUITO</span>
          <span className={`mt-1 block text-[10px] font-semibold tracking-[0.19em] ${inverse ? "text-white/65" : "text-slate-500"}`}>
            RESTAURANTE
          </span>
        </span>
      )}
    </div>
  );
}
