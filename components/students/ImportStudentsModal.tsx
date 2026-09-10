"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Upload, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { parseSpreadsheetFile } from "@/lib/utils/importParser";
import { exportToCsv } from "@/lib/utils/csv";
import Modal from "@/components/ui/Modal";

type ParsedRow = {
  first_name: string;
  last_name: string;
  gender: "male" | "female" | null;
  birth_date: string | null;
  internal_number: string | null;
  isValid: boolean;
  error?: string;
};

const HEADER_ALIASES: Record<string, string[]> = {
  first_name: ["الاسم", "الإسم", "first_name", "firstname", "name"],
  last_name: ["اللقب", "last_name", "lastname"],
  gender: ["الجنس", "gender"],
  birth_date: ["تاريخ الميلاد", "birth_date", "birthdate"],
  internal_number: ["الرقم الداخلي", "رقم داخلي", "internal_number"],
};

function findField(row: Record<string, string>, field: keyof typeof HEADER_ALIASES): string {
  const aliases = HEADER_ALIASES[field];
  const rowKeys = Object.keys(row);
  for (const alias of aliases) {
    const match = rowKeys.find((k) => k.trim().toLowerCase() === alias.toLowerCase());
    if (match) return (row[match] ?? "").toString().trim();
  }
  return "";
}

function parseGender(raw: string): "male" | "female" | null {
  const v = raw.trim();
  if (["ذكر", "male", "m"].includes(v.toLowerCase())) return "male";
  if (["أنثى", "انثى", "female", "f"].includes(v.toLowerCase())) return "female";
  return null;
}

export default function ImportStudentsModal({
  open,
  onClose,
  onImported,
  teacherId,
  classes,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  teacherId: string;
  classes: { id: string; name: string }[];
}) {
  const supabase = createClient();

  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  function downloadTemplate() {
    exportToCsv("نموذج_استيراد_التلاميذ", [
      { الاسم: "محمد", اللقب: "بن علي", الجنس: "ذكر", "تاريخ الميلاد": "2015-03-12", "الرقم الداخلي": "001" },
      { الاسم: "أمينة", اللقب: "حمزة", الجنس: "أنثى", "تاريخ الميلاد": "2015-07-04", "الرقم الداخلي": "002" },
    ]);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      const parsed = await parseSpreadsheetFile(file);
      const mapped: ParsedRow[] = parsed.map((row) => {
        const first_name = findField(row, "first_name");
        const last_name = findField(row, "last_name");
        const genderRaw = findField(row, "gender");
        const birth_date = findField(row, "birth_date") || null;
        const internal_number = findField(row, "internal_number") || null;

        const isValid = Boolean(first_name && last_name);

        return {
          first_name,
          last_name,
          gender: parseGender(genderRaw),
          birth_date,
          internal_number,
          isValid,
          error: isValid ? undefined : "الاسم أو اللقب مفقود",
        };
      });
      setRows(mapped);
      if (mapped.length === 0) {
        toast.error("لم يتم العثور على أي صفوف في الملف");
      }
    } catch {
      toast.error("تعذّر قراءة الملف. تأكد أنه بصيغة CSV أو Excel صحيحة");
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  }

  async function handleImport() {
    if (!classId) {
      toast.error("اختر القسم أولًا");
      return;
    }
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("لا توجد صفوف صالحة للاستيراد");
      return;
    }

    setImporting(true);
    const { error } = await supabase.from("students").insert(
      validRows.map((r) => ({
        teacher_id: teacherId,
        class_id: classId,
        first_name: r.first_name,
        last_name: r.last_name,
        gender: r.gender,
        birth_date: r.birth_date,
        internal_number: r.internal_number,
        status: "active",
      }))
    );
    setImporting(false);

    if (error) {
      toast.error("تعذّر استيراد التلاميذ");
      return;
    }

    toast.success(`تم استيراد ${validRows.length} تلميذ بنجاح`);
    setRows([]);
    onImported();
    onClose();
  }

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <Modal open={open} onClose={onClose} title="استيراد التلاميذ من Excel / CSV" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <button onClick={downloadTemplate} className="btn-secondary w-auto px-4 text-xs">
          <Download size={14} className="ml-1" />
          تنزيل نموذج CSV فارغ
        </button>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            القسم المستهدف *
          </label>
          <select className="input-field" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary-400 dark:border-gray-700">
          <Upload size={24} className="text-gray-400" />
          <span className="text-sm text-gray-500">
            {parsing ? "جارٍ التحليل..." : "اضغط لاختيار ملف CSV أو Excel"}
          </span>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
        </label>

        {rows.length > 0 && (
          <>
            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1 text-primary-600">
                <CheckCircle2 size={14} /> {validCount} صالح
              </span>
              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1 text-red-600">
                  <AlertTriangle size={14} /> {invalidCount} به خطأ (سيُتجاهل)
                </span>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 border-b border-gray-100 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-2">الاسم</th>
                    <th className="px-3 py-2">اللقب</th>
                    <th className="px-3 py-2">الجنس</th>
                    <th className="px-3 py-2">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((row, i) => (
                    <tr key={i} className={!row.isValid ? "bg-red-50 dark:bg-red-950/30" : ""}>
                      <td className="px-3 py-1.5">{row.first_name || "—"}</td>
                      <td className="px-3 py-1.5">{row.last_name || "—"}</td>
                      <td className="px-3 py-1.5">
                        {row.gender === "male" ? "ذكر" : row.gender === "female" ? "أنثى" : "—"}
                      </td>
                      <td className="px-3 py-1.5">
                        {row.isValid ? (
                          <span className="text-primary-600">صالح</span>
                        ) : (
                          <span className="text-red-600">{row.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={handleImport} disabled={importing || validCount === 0} className="btn-primary">
              {importing ? "جارٍ الاستيراد..." : `استيراد ${validCount} تلميذ`}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
