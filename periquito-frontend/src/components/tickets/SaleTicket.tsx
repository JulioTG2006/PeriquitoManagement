import { useEffect } from "react";
import { FileDown, Printer } from "lucide-react";
import { Modal } from "../admin/AdminUi";
import { formatCurrency, formatPeruDateTime } from "../../utils/format";

export interface SaleTicketItem {
  dishName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleTicketData {
  saleId: number;
  orderId: number;
  tableNumber: number | null;
  waiterName: string;
  soldAt: string;
  totalAmount: number;
  details: SaleTicketItem[];
}

export function SaleTicket({
  ticket,
  onClose,
  onBackToTables,
  autoPrint = false,
}: {
  ticket: SaleTicketData;
  onClose: () => void;
  onBackToTables?: () => void;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) return;
    const timeout = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timeout);
  }, [autoPrint]);

  return <Modal title={`Ticket de venta #${ticket.saleId}`} description="Documento interno de consumo. Puedes imprimirlo o guardarlo como PDF." onClose={onClose}>
    <div className="space-y-4">
      <div className="ticket-no-print flex flex-wrap gap-2">
        <button className="button-primary" onClick={() => window.print()} type="button"><Printer size={17} />Imprimir ticket</button>
        <button className="button-secondary" onClick={() => window.print()} type="button"><FileDown size={17} />Guardar como PDF</button>
        {onBackToTables && <button className="button-quiet sm:ml-auto" onClick={onBackToTables} type="button">Regresar a mesas</button>}
      </div>
      <article className="sale-ticket-print mx-auto w-full max-w-[360px] border border-dashed border-slate-300 bg-white p-5 text-slate-900 shadow-sm">
        <header className="flex flex-col items-center border-b border-dashed border-slate-300 pb-4 text-center">
          <img alt="Cevichería Periquito" className="size-28 rounded-full object-contain" src="/logo-periquito.png" />
          <h2 className="mt-2 text-lg font-extrabold tracking-wide">CEVICHERÍA PERIQUITO</h2>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">Ticket interno de consumo</p>
        </header>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-b border-dashed border-slate-300 py-3 text-xs">
          <dt>Venta</dt><dd className="text-right font-bold">#{ticket.saleId}</dd>
          <dt>Pedido</dt><dd className="text-right">#{ticket.orderId}</dd>
          <dt>Mesa</dt><dd className="text-right">{ticket.tableNumber == null ? "Para llevar" : `Mesa ${ticket.tableNumber}`}</dd>
          <dt>Mesero</dt><dd className="text-right">{ticket.waiterName}</dd>
          <dt>Fecha</dt><dd className="text-right">{formatPeruDateTime(ticket.soldAt)}</dd>
        </dl>
        <div className="border-b border-dashed border-slate-300 py-3">
          <div className="mb-2 grid grid-cols-[1fr_auto] gap-2 text-[10px] font-bold uppercase text-slate-600"><span>Detalle</span><span>Importe</span></div>
          <ul className="space-y-3">
            {ticket.details.map((item, index) => <li className="text-xs" key={`${item.dishName}-${index}`}>
              <div className="flex justify-between gap-2 font-bold"><span>{item.dishName}</span><span>{formatCurrency(item.subtotal)}</span></div>
              <p className="mt-0.5 text-[11px] text-slate-600">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
            </li>)}
          </ul>
        </div>
        <div className="flex items-center justify-between py-3 text-base font-extrabold"><span>Total</span><span>{formatCurrency(ticket.totalAmount)}</span></div>
        <footer className="border-t border-dashed border-slate-300 pt-3 text-center">
          <p className="font-semibold">¡Gracias por tu visita!</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide">Documento interno sin validez tributaria</p>
        </footer>
      </article>
      <p className="ticket-no-print text-center text-xs text-slate-500">Para PDF, elige «Guardar como PDF» en el destino de impresión.</p>
    </div>
  </Modal>;
}
