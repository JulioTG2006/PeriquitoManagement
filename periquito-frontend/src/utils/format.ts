const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

const dateFormat = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
});

export function formatCurrency(value: number) {
  return soles.format(value);
}

export function formatShortDate(value: string) {
  return dateFormat.format(new Date(`${value}T12:00:00`));
}

export function roleLandingPath(role: string) {
  return role === "Administrador" ? "/admin/dashboard" : "/mesero/mesas";
}
