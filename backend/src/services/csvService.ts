import { parse } from "csv-parse/sync";
import { RawRow } from "../types/crm";

/**
 * Parses a CSV buffer into an array of raw row objects.
 * Handles: BOM, different delimiters, empty lines, quoted fields.
 */
export function parseCSV(buffer: Buffer): RawRow[] {
  // Strip BOM if present
  let content = buffer.toString("utf-8");
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  // Auto-detect delimiter by sampling the first line
  const firstLine = content.split("\n")[0] || "";
  let delimiter = ",";
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) delimiter = "\t";
  else if (semicolonCount > commaCount) delimiter = ";";

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter,
    relax_column_count: true,
    relax_quotes: true,
    quote: '"',
  }) as RawRow[];

  return records;
}

/**
 * Returns up to `n` sample rows for schema discovery prompt.
 */
export function getSampleRows(rows: RawRow[], n = 3): RawRow[] {
  return rows.slice(0, n);
}
