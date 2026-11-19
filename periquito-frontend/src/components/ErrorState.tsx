import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
      <AlertCircle className="mb-3 text-rose-600" size={25} />
      <p className="max-w-lg text-sm text-rose-800">{message}</p>
      <button className="button-secondary mt-4" onClick={onRetry} type="button">
        <RefreshCw size={16} /> Reintentar
      </button>
    </div>
  );
}
