/**
 * Generates a CSV file from structured data and triggers a browser download.
 */

function escapeCsvValue(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv<T extends object>(
  filename: string,
  columns: { key: string; label: string }[],
  data: T[],
): void {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',');

  const rows = data.map((row) =>
    columns.map((c) => escapeCsvValue((row as Record<string, unknown>)[c.key])).join(','),
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
