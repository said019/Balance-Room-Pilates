export function formatDbDate(value: string | Date | null | undefined): string {
  if (!value) return 'Sin fecha';
  const iso = value instanceof Date ? value.toISOString() : String(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date(iso).toLocaleDateString();
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString();
}
