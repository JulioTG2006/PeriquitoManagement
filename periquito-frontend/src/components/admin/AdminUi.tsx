import type { FormEvent, ReactNode } from "react";
import { Search, X } from "lucide-react";
import { EmptyState } from "../EmptyState";

export function PageTitle({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-4">
    <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal">{eyebrow ?? "Administración"}</p><h2 className="font-display mt-1 text-2xl font-bold text-navy sm:text-3xl">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>;
}

export function SearchInput({ value, onChange, placeholder = "Buscar…", label }: { value: string; onChange: (value: string) => void; placeholder?: string; label?: string }) {
  return <label className="block min-w-[220px] flex-1 text-sm font-semibold text-slate-700 sm:max-w-sm">{label ?? <span className="sr-only">{placeholder}</span>}<span className="relative mt-2 block"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="field-input block !pl-11" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></span></label>;
}

export function TextField({ label, value, onChange, type = "text", required, maxLength, min, step, placeholder, autoComplete }: {
  label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean; maxLength?: number; min?: number; step?: number; placeholder?: string; autoComplete?: string;
}) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input autoComplete={autoComplete} className="field-input mt-2 block" maxLength={maxLength} min={min} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} step={step} type={type} value={value} /></label>;
}

export function SelectField({ label, value, onChange, children, required }: { label: string; value: string | number; onChange: (value: string) => void; children: ReactNode; required?: boolean }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<select className="field-input mt-2 block" onChange={(event) => onChange(event.target.value)} required={required} value={value}>{children}</select></label>;
}

export function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700"><input checked={checked} className="size-4 accent-teal" onChange={(event) => onChange(event.target.checked)} type="checkbox" />{label}</label>;
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "success" | "warning" | "danger" | "neutral" | "info" }) {
  const classes = { success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700", danger: "bg-rose-50 text-rose-700", neutral: "bg-slate-100 text-slate-600", info: "bg-sky-50 text-sky-700" };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${classes[tone]}`}>{children}</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`surface-card ${className}`}>{children}</section>;
}

export interface TableColumn<T> {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({ rows, columns, rowKey, emptyTitle = "No hay resultados", emptyDescription = "Prueba ajustar los filtros." }: {
  rows: T[]; columns: TableColumn<T>[]; rowKey: (row: T) => string | number; emptyTitle?: string; emptyDescription?: string;
}) {
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{columns.map((column) => <th className={`px-4 py-3 font-bold sm:px-5 ${column.className ?? ""}`} key={column.key}>{column.title}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-slate-100 align-middle" key={rowKey(row)}>{columns.map((column) => <td className={`px-4 py-3.5 text-slate-600 sm:px-5 ${column.className ?? ""}`} key={column.key}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>;
}

export function Modal({ title, description, onClose, children, size = "md" }: { title: string; description?: string; onClose: () => void; children: ReactNode; size?: "md" | "lg" }) {
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section aria-modal="true" className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${size === "lg" ? "max-w-3xl" : "max-w-xl"}`} role="dialog" aria-labelledby="admin-modal-title">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-7"><div><h3 className="text-lg font-bold text-navy" id="admin-modal-title">{title}</h3>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div><button aria-label="Cerrar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-navy" onClick={onClose} type="button"><X size={19} /></button></header>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  </div>;
}

export function ConfirmDialog({ title, description, confirmLabel = "Confirmar", loading, onCancel, onConfirm, danger = true }: {
  title: string; description: string; confirmLabel?: string; loading?: boolean; onCancel: () => void; onConfirm: () => void; danger?: boolean;
}) {
  return <Modal title={title} description={description} onClose={onCancel}><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="button-secondary" onClick={onCancel} type="button">Volver</button><button className={danger ? "inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60" : "button-primary"} disabled={loading} onClick={onConfirm} type="button">{loading ? "Procesando…" : confirmLabel}</button></div></Modal>;
}

export function FormActions({ onCancel, submitLabel = "Guardar", loading }: { onCancel: () => void; submitLabel?: string; loading?: boolean }) {
  return <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button className="button-secondary" onClick={onCancel} type="button">Cancelar</button><button className="button-primary" disabled={loading} type="submit">{loading ? "Guardando…" : submitLabel}</button></div>;
}

export function Form({ onSubmit, children, className = "space-y-4" }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode; className?: string }) {
  return <form className={className} onSubmit={onSubmit}>{children}</form>;
}
