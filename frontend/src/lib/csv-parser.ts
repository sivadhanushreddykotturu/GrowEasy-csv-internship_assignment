import Papa from "papaparse";

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/**
 * Parse a CSV File on the client-side using PapaParse.
 * Returns headers, rows, and total count. Used for Step 2 preview only.
 */
export function parseCSVClient(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = (results.data as Record<string, string>[]).map((row) => {
          const cleaned: Record<string, string> = {};
          for (const key of headers) {
            cleaned[key] = String(row[key] ?? "").trim();
          }
          return cleaned;
        });

        resolve({
          headers,
          rows,
          totalRows: rows.length,
        });
      },
      error: (error) => {
        reject(new Error(`CSV parse error: ${error.message}`));
      },
    });
  });
}
