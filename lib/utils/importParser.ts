import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * يحلّل ملف CSV أو Excel (xlsx/xls) ويعيده كمصفوفة كائنات
 * (مفتاح = اسم العمود من السطر الأول، قيمة = محتوى الخلية كنص).
 */
export async function parseSpreadsheetFile(file: File): Promise<Record<string, string>[]> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");

  if (isCsv) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as Record<string, string>[]),
        error: (err) => reject(err),
      });
    });
  }

  // xlsx / xls
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) as Record<string, unknown>[];

  return rows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key] = String(value ?? "").trim();
    }
    return normalized;
  });
}
