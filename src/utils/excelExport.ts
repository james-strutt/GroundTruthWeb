/**
 * Generates a simple XML-based Excel file and triggers download.
 * Uses SpreadsheetML format which Excel, Google Sheets, and LibreOffice support.
 */

function escapeXml(value: unknown): string {
  const str = value == null ? '' : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function detectType(value: unknown): 'Number' | 'String' | 'DateTime' {
  if (typeof value === 'number' || typeof value === 'bigint') return 'Number';
  if (value instanceof Date) return 'DateTime';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return 'DateTime';
  return 'String';
}

function formatCell(value: unknown, type: 'Number' | 'String' | 'DateTime'): string {
  if (type === 'DateTime' && typeof value === 'string') {
    return `<Cell ss:StyleID="date"><Data ss:Type="String">${escapeXml(new Date(value).toLocaleDateString('en-AU'))}</Data></Cell>`;
  }
  if (type === 'Number') {
    return `<Cell><Data ss:Type="Number">${Number(value)}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

export function exportToExcel<T extends object>(
  filename: string,
  columns: { key: string; label: string }[],
  data: T[],
): void {
  const headerRow = columns
    .map((c) => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(c.label)}</Data></Cell>`)
    .join('');

  const dataRows = data.map((row) => {
    const cells = columns.map((c) => {
      const value = (row as Record<string, unknown>)[c.key];
      const type = detectType(value);
      return formatCell(value, type);
    });
    return `<Row>${cells.join('')}</Row>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
    <Style ss:ID="header"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/><Interior ss:Color="#E7E5E4" ss:Pattern="Solid"/></Style>
    <Style ss:ID="date"><NumberFormat ss:Format="dd/mm/yyyy"/></Style>
  </Styles>
  <Worksheet ss:Name="Export">
    <Table>
      ${columns.map((c) => `<Column ss:AutoFitWidth="1" ss:Width="${Math.max(80, c.label.length * 10)}"/>`).join('\n      ')}
      <Row>${headerRow}</Row>
      ${dataRows.join('\n      ')}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
