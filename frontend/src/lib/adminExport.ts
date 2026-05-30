import ExcelJS from 'exceljs';

export type ExportFormat = 'xlsx' | 'csv';

export type ExportColumn = {
  header: string;
  key: string;
  width?: number;
  defaultSelected?: boolean;
};

export type ExportSheet = {
  name: string;
  columns: ExportColumn[];
  rows: Array<Record<string, unknown>>;
};

export type ExportWorkbook = {
  fileName: string;
  title: string;
  subtitle?: string;
  sheets: ExportSheet[];
  format?: ExportFormat;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

export const formatExportTimestamp = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}-${pad2(date.getHours())}${pad2(date.getMinutes())}`;

export const buildExportFileName = (prefix: string, format: ExportFormat = 'xlsx', date = new Date()) => {
  const safePrefix = prefix.trim().replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${safePrefix || 'export'}-${formatExportTimestamp(date)}.${format}`;
};

export const getDefaultSelectedColumns = (columns: ExportColumn[]) => columns.filter((column) => column.defaultSelected !== false).map((column) => column.key);

const formatValue = (value: unknown): string | number => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.toLocaleString('vi-VN');
  if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('vi-VN');
  }
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const download = (payload: BlobPart, fileName: string, mimeType: string) => {
  const blob = new Blob([payload], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const createCsv = (title: string, subtitle: string | undefined, sheet: ExportSheet) => {
  const lines: string[] = [];
  lines.push([title, subtitle ? `- ${subtitle}` : ''].filter(Boolean).join(' '));
  lines.push('');
  lines.push(sheet.columns.map((column) => column.header).join(','));
  for (const row of sheet.rows) {
    lines.push(sheet.columns.map((column) => `"${String(formatValue(row[column.key])).replace(/"/g, '""')}"`).join(','));
  }
  return `${lines.join('\n')}`;
};

const autoWidth = (column: ExportColumn) => column.width ?? Math.max(14, Math.min(36, column.header.length + 6));

const styleHeaderRow = (row: ExcelJS.Row) => {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
};

const styleDataRows = (worksheet: ExcelJS.Worksheet, startRow: number) => {
  for (let rowNumber = startRow; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    row.alignment = { vertical: 'middle', wrapText: true };
    row.border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    };
    if ((rowNumber - startRow) % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  }
};

export async function exportWorkbook({ fileName, title, subtitle, sheets, format = 'xlsx' }: ExportWorkbook) {
  if (format === 'csv') {
    download(createCsv(title, subtitle, sheets[0]), fileName.endsWith('.csv') ? fileName : `${fileName.replace(/\.xlsx$/i, '')}.csv`, 'text/csv;charset=utf-8;');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IT Compass Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  sheets.forEach((sheetDef, index) => {
    const worksheet = workbook.addWorksheet(sheetDef.name);
    worksheet.columns = sheetDef.columns.map((column) => ({ header: column.header, key: column.key, width: autoWidth(column) }));

    worksheet.addRow([title]);
    worksheet.mergeCells(1, 1, 1, sheetDef.columns.length);
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    if (subtitle) {
      worksheet.addRow([subtitle]);
      worksheet.mergeCells(2, 1, 2, sheetDef.columns.length);
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.font = { italic: true, color: { argb: 'FF64748B' } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    if (index === 0) worksheet.addRow([]);

    const headerRow = worksheet.addRow(sheetDef.columns.map((column) => column.header));
    styleHeaderRow(headerRow);
    worksheet.views = [{ state: 'frozen', ySplit: worksheet.rowCount >= 4 ? 3 : 1 }];

    if (sheetDef.rows.length > 0) {
      for (const row of sheetDef.rows) {
        worksheet.addRow(sheetDef.columns.map((column) => formatValue(row[column.key])));
      }
    } else {
      const emptyRow = worksheet.addRow(['Không có dữ liệu']);
      worksheet.mergeCells(emptyRow.number, 1, emptyRow.number, sheetDef.columns.length);
      emptyRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      emptyRow.font = { italic: true, color: { argb: 'FF64748B' } };
    }

    styleDataRows(worksheet, headerRow.number + 1);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  download(buffer, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export async function collectPagedItems<TResponse, TItem>({
  initialPage,
  fetchPage,
  selectItems,
  selectPagination,
  pageSize = 100,
}: {
  initialPage?: TResponse;
  fetchPage: (page: number, limit: number) => Promise<TResponse>;
  selectItems: (response: TResponse) => TItem[];
  selectPagination: (response: TResponse) => { page: number; totalPages: number };
  pageSize?: number;
}) {
  const first = initialPage ?? await fetchPage(1, pageSize);
  const { totalPages } = selectPagination(first);
  const items = selectItems(first);

  if (totalPages <= 1) return items;

  const pages = await Promise.all(Array.from({ length: totalPages - 1 }, (_unused, index) => fetchPage(index + 2, pageSize)));
  return [...items, ...pages.flatMap((page) => selectItems(page))];
}
