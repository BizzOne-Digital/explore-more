export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export type AdminRecord = Record<string, unknown> & { _id?: string };

export function toAdminRecord<T>(value: T): AdminRecord {
  return serialize(value) as AdminRecord;
}

export function formatDate(date: unknown): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date as string | Date));
}

export function formatDateTime(date: unknown): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date as string | Date));
}
