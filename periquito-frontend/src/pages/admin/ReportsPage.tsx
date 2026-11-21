import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { DateRangeControls, rangeForPreset, type DateRangeValue } from "../../components/admin/DateRangeControls";
import { PageTitle, Panel } from "../../components/admin/AdminUi";
import { adminService } from "../../services/adminService";
import { getApiErrorMessage } from "../../services/api";

export function ReportsPage() {
  const [range, setRange] = useState<DateRangeValue>(() => rangeForPreset("week"));
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const response = await adminService.downloadSalesReport(range);
      const disposition = response.headers["content-disposition"] as string | undefined;
      const encodedName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      const plainName = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
      const filename = (encodedName && decodeURIComponent(encodedName)) || plainName || `reporte-ventas-${range.fromDate ?? "inicio"}-${range.toDate ?? "actualidad"}.xlsx`;
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = filename; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Reporte descargado", { description: filename });
    } catch (cause) {
      let message = getApiErrorMessage(cause, "No se pudo generar el reporte.");
      if (cause && typeof cause === "object" && "response" in cause) {
        const response = (cause as { response?: { data?: unknown } }).response;
        if (response?.data instanceof Blob) {
          try { const problem = JSON.parse(await response.data.text()) as { detail?: string; title?: string }; message = problem.detail || problem.title || message; }
          catch {}
        }
      }
      toast.error("Error al descargar el reporte", { description: message });
    } finally { setLoading(false); }
  }

  return <div className="space-y-6"><PageTitle title="Reportes" description="Genera el reporte de ventas en formato Excel." /><DateRangeControls onApply={setRange} /><Panel className="flex flex-col items-center px-6 py-12 text-center sm:py-16"><span className="grid size-16 place-items-center rounded-2xl bg-teal/10 text-teal"><FileSpreadsheet size={30} /></span><h3 className="mt-5 text-xl font-bold text-navy">Reporte de ventas</h3><p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">El archivo incluye el resumen financiero, ventas y productos del período seleccionado por la API.</p><button className="button-primary mt-6" disabled={loading} onClick={() => void download()} type="button"><Download size={17} />{loading ? "Generando archivo…" : "Descargar Excel"}</button></Panel></div>;
}
