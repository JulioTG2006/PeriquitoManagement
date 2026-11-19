import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "navy" | "blue";
}

const toneClasses = {
  teal: "bg-teal/10 text-teal",
  amber: "bg-amber/15 text-amber-700",
  navy: "bg-navy/10 text-navy",
  blue: "bg-sky-100 text-sky-700",
};

export function MetricCard({ label, value, note, icon: Icon, tone = "teal" }: MetricCardProps) {
  return (
    <article className="surface-card flex min-h-36 items-start justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-3 truncate text-2xl font-bold tracking-tight text-navy">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{note}</p>
      </div>
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}>
        <Icon size={20} strokeWidth={2.1} />
      </span>
    </article>
  );
}
