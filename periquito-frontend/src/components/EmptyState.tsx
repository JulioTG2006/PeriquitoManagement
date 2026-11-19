import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <div>
        <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500">
          <Inbox size={20} />
        </span>
        <h3 className="font-semibold text-navy">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
