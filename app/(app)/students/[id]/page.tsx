import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Stethoscope, Calendar, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PrintButton from "@/components/students/PrintButton";

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  transferred: "منتقل",
  inactive: "غير نشط",
};

const GENDER_LABELS: Record<string, string> = {
  male: "ذكر",
  female: "أنثى",
};

export default async function StudentCardPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, first_name, last_name, birth_date, gender, internal_number, status, has_medical_exemption, exemption_reason, exemption_start, exemption_end, notes, class_id, classes(name, schools(name), levels(code, label_ar))"
    )
    .eq("id", params.id)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!student) notFound();

  // ملخص الحضور: نجلب كل سجلات الحضور الخاصة بهذا التلميذ
  const { data: attendanceRecords } = await supabase
    .from("attendance_records")
    .select("status")
    .eq("student_id", student.id);

  const attendanceTotal = attendanceRecords?.length ?? 0;
  const presentCount = attendanceRecords?.filter((r) => r.status === "present").length ?? 0;
  const absentCount = attendanceRecords?.filter((r) => r.status === "absent").length ?? 0;
  const lateCount = attendanceRecords?.filter((r) => r.status === "late").length ?? 0;
  const attendanceRate =
    attendanceTotal > 0 ? Math.round((presentCount / attendanceTotal) * 100) : null;

  // ملخص التقييمات: متوسط النتائج بالنسبة المئوية عبر كل شبكات التقييم
  const { data: evaluationResults } = await supabase
    .from("evaluation_results")
    .select("score, evaluation_criteria(max_score)")
    .eq("student_id", student.id);

  const evalRows = (evaluationResults ?? []) as unknown as {
    score: number;
    evaluation_criteria: { max_score: number } | null;
  }[];
  const evalAverage =
    evalRows.length > 0
      ? Math.round(
          (evalRows.reduce(
            (sum, r) => sum + r.score / (r.evaluation_criteria?.max_score || 1),
            0
          ) /
            evalRows.length) *
            100
        )
      : null;

  const classInfo = student.classes as unknown as {
    name: string;
    schools: { name: string } | null;
    levels: { code: string; label_ar: string } | null;
  } | null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/students"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowRight size={16} />
          العودة إلى قائمة التلاميذ
        </Link>
        <PrintButton />
      </div>

      {/* رأس البطاقة */}
      <div className="card">
        <div className="flex items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white">
            {student.first_name.charAt(0)}
          </span>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-sm text-gray-500">
              {classInfo?.name} · {classInfo?.levels?.label_ar} · {classInfo?.schools?.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {STATUS_LABELS[student.status]}
              </span>
              {student.has_medical_exemption && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Stethoscope size={12} /> إعفاء طبي
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* المعلومات الأساسية */}
      <div className="card">
        <h2 className="mb-3 text-base font-semibold">المعلومات الأساسية</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1 text-gray-400">
              <Calendar size={13} /> تاريخ الميلاد
            </dt>
            <dd className="mt-1 font-medium">{student.birth_date || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-400">الجنس</dt>
            <dd className="mt-1 font-medium">
              {student.gender ? GENDER_LABELS[student.gender] : "—"}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-gray-400">
              <Hash size={13} /> الرقم الداخلي
            </dt>
            <dd className="mt-1 font-medium">{student.internal_number || "—"}</dd>
          </div>
        </dl>

        {student.has_medical_exemption && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950">
            <p className="font-medium text-amber-800 dark:text-amber-300">تفاصيل الإعفاء الطبي</p>
            <p className="mt-1 text-amber-700 dark:text-amber-400">
              {student.exemption_reason || "بدون سبب مسجّل"}
              {student.exemption_start && ` · من ${student.exemption_start}`}
              {student.exemption_end && ` إلى ${student.exemption_end}`}
            </p>
          </div>
        )}
      </div>

      {/* ملخص الحضور */}
      <div className="card">
        <h2 className="mb-3 text-base font-semibold">الحضور</h2>
        {attendanceTotal === 0 ? (
          <p className="text-sm text-gray-400">لا توجد سجلات حضور بعد لهذا التلميذ.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-primary-50 p-3 text-center dark:bg-primary-950">
              <p className="text-xl font-bold text-primary-700 dark:text-primary-300">
                {attendanceRate}%
              </p>
              <p className="text-xs text-gray-500">نسبة الحضور</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-800">
              <p className="text-xl font-bold">{presentCount}</p>
              <p className="text-xs text-gray-500">حضور</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center dark:bg-red-950">
              <p className="text-xl font-bold text-red-600">{absentCount}</p>
              <p className="text-xs text-gray-500">غياب</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center dark:bg-amber-950">
              <p className="text-xl font-bold text-amber-600">{lateCount}</p>
              <p className="text-xs text-gray-500">تأخر</p>
            </div>
          </div>
        )}
      </div>

      {/* ملخص التقييمات */}
      <div className="card">
        <h2 className="mb-3 text-base font-semibold">التقييمات</h2>
        {evalAverage === null ? (
          <p className="text-sm text-gray-400">لا توجد نتائج تقويم بعد لهذا التلميذ.</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary-50 p-3 text-center dark:bg-primary-950">
              <p className="text-xl font-bold text-primary-700 dark:text-primary-300">
                {evalAverage}%
              </p>
              <p className="text-xs text-gray-500">متوسط الأداء العام</p>
            </div>
            <p className="text-sm text-gray-500">
              محسوب من {evalRows.length} نتيجة تقييم مسجّلة
            </p>
          </div>
        )}
      </div>

      {/* الملاحظات */}
      <div className="card">
        <h2 className="mb-3 text-base font-semibold">ملاحظات الأستاذ</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {student.notes || "لا توجد ملاحظات مسجّلة."}
        </p>
      </div>
    </div>
  );
}
