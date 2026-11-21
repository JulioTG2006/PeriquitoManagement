const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

const dateFormat = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "2-digit",
  month: "short",
});

export function formatCurrency(value: number) {
  return soles.format(value);
}

export function formatShortDate(value: string) {
  return dateFormat.format(new Date(`${value}T12:00:00Z`));
}

export function roleLandingPath(role: string) {
  return role === "Administrador" ? "/admin/dashboard" : "/mesero/mesas";
}

const limaDateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const limaDateTime = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  dateStyle: "medium",
  timeStyle: "short",
});

export function peruDateOnly(date = new Date()) {
  const parts = Object.fromEntries(limaDateParts.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatPeruDateTime(value: string) {
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return limaDateTime.format(new Date(hasTimeZone ? value : `${value}Z`));
}

export function dateOnlyPlusDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function peruLocalDateTimeToUtc(value: string, endOfDay = false) {
  const time = endOfDay ? "23:59:59.999" : "00:00:00";
  return new Date(`${value}T${time}-05:00`).toISOString();
}
