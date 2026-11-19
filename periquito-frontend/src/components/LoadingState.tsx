import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Cargando información" }: { label?: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center gap-3 text-sm font-medium text-slate-500" role="status">
      <LoaderCircle className="animate-spin text-teal" size={21} />
      {label}
    </div>
  );
}
