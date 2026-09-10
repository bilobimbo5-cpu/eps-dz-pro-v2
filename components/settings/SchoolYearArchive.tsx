"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Archive, CalendarRange, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type SchoolYearRow = {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_archived: boolean;
  archived_at: string | null;
};

function nextYearDefaults(currentLabel: string) {
  const match = currentLabel.match(/(\d{4})/);
  const startYear = match ? Number(match[1]) + 1 : new Date().getFullYear();
  return {
    label: `${startYear}/${startYear + 1}`,
    start: `${startYear}-09-01`,
    end: `${startYear + 1}-06-30`,
  };
}

export default function SchoolYearArchive({ teacherId }: { teacherId: string }) {
  const supabase = createClient();
  const [years, setYears] = useState<SchoolYearRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [newYear, setNewYear] = useState({ label: "", start: "", end: "" });

  const loadYears = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("school_years")
      .select("id, label, start_date, end_date, is_active, is_archived, archived_at")
      .eq("teacher_id", teacherId)
      .order("start_date", { ascending: false });
    setYears(data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  const activeYear = years.find((y) => y.is_active && !y.is_archived);

  function openCloseDialog() {
    if (!activeYear) return;
    setNewYear(nextYearDefaults(activeYear.label));
    setConfirmOpen(true);
  }

  async function handleCloseYear() {
    if (!activeYear) return;
    setClosing(true);

    const { error: archiveError } = await supabase
      .from("school_years")
      .update({ is_active: false, is_archived: true, archived_at: new Date().toISOString() })
      .eq("id", activeYear.id);

    if (archiveError) {
      setClosing(false);
      toast.error("تعذّر أرشفة الموسم الحالي");
      return;
    }

    const { error: createError } = await supabase.from("school_years").insert({
      teacher_id: teacherId,
      label: newYear.label,
      start_date: newYear.start,
      end_date: newYear.end,
      is_active: true,
    });

    setClosing(false);
    setConfirmOpen(false);

    if (createError) {
      toast.error("تمت الأرشفة لكن تعذّر إنشاء الموسم الجديد — أنشئه يدويًا من هنا");
      loadYears();
      return;
    }

    toast.success(`تم إغلاق الموسم وبدء ${newYear.label} بنجاح`);
    loadYears();
  }

  return (
    <div className="card space-y-4">
      <h3 className="text-base font-semibold">الموسم الدراسي والأرشيف</h3>

      {loading ? (
        <p className="text-sm text-gray-400">جارٍ التحميل...</p>
      ) : (
        <>
          {activeYear ? (
            <div className="flex items-center justify-between rounded-xl bg-primary-50 p-4 dark:bg-primary-950">
              <div className="flex items-center gap-2">
                <CalendarRange size={18} className="text-primary-600" />
                <div>
                  <p className="font-semibold text-primary-700 dark:text-primary-300">{activeYear.label}</p>
                  <p className="text-xs text-gray-500">الموسم النشط حاليًا</p>
                </div>
              </div>
              <button onClick={openCloseDialog} className="btn-secondary w-auto px-4 text-xs">
                <Lock size={14} className="ml-1" />
                إغلاق الموسم وبدء موسم جديد
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">لا يوجد موسم دراسي نشط حاليًا.</p>
          )}

          {years.filter((y) => y.is_archived).length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-500">
                <Archive size={14} />
                المواسم المؤرشفة
              </p>
              <ul className="space-y-1.5">
                {years
                  .filter((y) => y.is_archived)
                  .map((y) => (
                    <li
                      key={y.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800"
                    >
                      <span>{y.label}</span>
                      <span className="text-xs text-gray-400">
                        أُرشف في {y.archived_at ? new Date(y.archived_at).toLocaleDateString("ar-DZ") : "—"}
                      </span>
                    </li>
                  ))}
              </ul>
              <p className="mt-2 text-xs text-gray-400">
                ملاحظة: عرض بيانات موسم مؤرشف بشكل منفصل (تصفية كل الصفحات حسبه) غير متاح بعد — هذا تحسين مستقبلي.
              </p>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="إغلاق الموسم الدراسي"
        message={`سيتم أرشفة موسم "${activeYear?.label}" وبدء موسم جديد "${newYear.label}" (${newYear.start} إلى ${newYear.end}). بيانات الموسم الحالي (المؤسسات، الأقسام...) تبقى محفوظة ولا تُحذف.`}
        confirmLabel="تأكيد الإغلاق"
        loading={closing}
        onConfirm={handleCloseYear}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
