/**
 * Formats an ISO date string to a short Australian-style display format.
 * e.g. "25 Mar 26"
 */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleDateString('en-AU', { month: 'short' });
  const year = String(d.getFullYear()).slice(2);
  return `${day} ${month} ${year}`;
}
