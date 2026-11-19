import { Construction } from "lucide-react";
export function ModulePlaceholderPage({ title }: { title: string }) {
  return <section className="surface-card mx-auto max-w-3xl px-6 py-14 text-center sm:px-10">
    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber/10 text-amber"><Construction size={25} /></span>
    <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-teal">Módulo preparado</p>
    <h2 className="mt-2 text-2xl font-bold text-navy">{title}</h2>
    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">La sección ya está integrada en la navegación. Sus operaciones se implementarán en una siguiente etapa.</p>
  </section>;
}
