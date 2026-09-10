"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  ClipboardCheck,
  CheckCheck,
  Save,
  Stethoscope,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import StatusToggle from "@/components/attendance/StatusToggle";
import {
  getClassStudents,
  getSessionRecords,
  saveAttendanceSession,
  getClassAttendanceSummary,
  getRecentSessions,
  type AttendanceStatus,
  type StudentForAttendance,
  type AttendanceSummary,
  type SessionHistoryItem,
} from "@/lib/attendance/queries";
import { cacheGet, cacheSet, queueWrite } from "@/lib/offline/db";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [sessionNumber, setSessionNumber] = useState(1);

  const [students, setStudents] = useState<StudentForAttendance[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [saving, setSaving] = useState(false);

  // تحميل قائمة الأقسام مرة واحدة
  useEffect(() => {
    async function loadClasses() {
      setLoadingClasses(true);
      try {
        const { data, error } = await supabase
          .from("classes")
          .select("id, name")
          .eq("teacher_id", teacherId)
          .order("name");
        if (error) throw error;
        setClasses(data ?? []);
        if (data && data.length > 0) setClassId(data[0].id);
        cacheSet("attendance-classes-list", data ?? []);
      } catch {
        const cached = await cacheGet<{ id: string; name: string }[]>("attendance-classes-list");
        if (cached) {
          setClasses(cached);
          if (cached.length > 0) setClassId(cached[0].id);
        }
      }
      setLoadingClasses(false);
    }
    loadClasses();
  }, [supabase, teacherId]);

  // تحميل تلاميذ القسم + جلسة الحضور + الملخص + السجل التاريخي عند تغيير القسم/التاريخ/الحصة
  const loadSessionData = useCallback(async () => {
    if (!classId) return;
    setLoadingSession(true);

    const cacheKey = `attendance-class-${classId}`;

    try {
      const [studentsData, sessionData, summaryData, historyData] = await Promise.all([
        getClassStudents(supabase, classId),
        getSessionRecords(supabase, teacherId, classId, date, sessionNumber),
        getClassAttendanceSummary(supabase, teacherId, classId),
        getRecentSessions(supabase, teacherId, classId),
      ]);

      setStudents(studentsData);
      setSessionId(sessionData.sessionId);
      // إن لم توجد جلسة سابقة، نترك الحالات فارغة (لا نفترض الحضور تلقائيًا)
      setStatuses(sessionData.records);
      setSummary(summaryData);
      setHistory(historyData);

      // نخزّن قائمة التلاميذ محليًا لاستعمالها لاحقًا في حال انقطع الاتصال
      cacheSet(cacheKey, studentsData);
    } catch {
      // فشل الجلب (غالبًا بسبب انقطاع الاتصال): نعرض آخر نسخة محفوظة محليًا إن وُجدت
      const cached = await cacheGet<StudentForAttendance[]>(cacheKey);
      if (cached) {
        setStudents(cached);
        setSessionId(null);
        setStatuses({});
        toast("أنت غير متصل — تُعرض قائمة التلاميذ المحفوظة مسبقًا", { icon: "📡" });
      } else {
        toast.error("تعذّر تحميل بيانات الحضور ولا توجد نسخة محفوظة محليًا");
      }
    }

    setLoadingSession(false);
  }, [supabase, teacherId, classId, date, sessionNumber]);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  function markAllPresent() {
    const next: Record<string, AttendanceStatus> = {};
    for (const s of students) next[s.id] = "present";
    setStatuses(next);
    toast.success("تم تحديد الجميع كحاضرين — يمكنك تعديل حالات فردية قبل الحفظ");
  }

  function setStudentStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  async function handleSave() {
    if (students.length === 0) return;

    const missing = students.filter((s) => !statuses[s.id]);
    if (missing.length > 0) {
      toast.error(`لم يتم تحديد حالة ${missing.length} تلميذ. حدد الجميع أولًا`);
      return;
    }

    const payload = { teacherId, classId, date, sessionNumber, statuses };

    // غير متصل: نحفظ العملية محليًا لمزامنتها تلقائيًا عند عودة الاتصال
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await queueWrite({ type: "attendance_session", payload });
      toast.success("تم حفظ الحضور محليًا — سيُزامَن تلقائيًا عند عودة الاتصال", {
        icon: "📡",
      });
      return;
    }

    setSaving(true);
    const { error } = await saveAttendanceSession(supabase, payload);
    setSaving(false);

    if (error) {
      // فشل الحفظ رغم ظهور الاتصال متاحًا (قد يكون انقطاعًا لحظيًا): نحفظ محليًا كخطة بديلة
      await queueWrite({ type: "attendance_session", payload });
      toast("تعذّر الوصول للخادم، تم حفظ الحضور محليًا وسيُعاد إرساله تلقائيًا", {
        icon: "📡",
      });
      return;
    }

    toast.success(sessionId ? "تم تحديث الحضور" : "تم حفظ الحضور بنجاح");
    loadSessionData();
  }

  const presentCount = Object.values(statuses).filter((s) => s === "present").length;
  const absentCount = Object.values(statuses).filter((s) => s === "absent").length;
  const lateCount = Object.values(statuses).filter((s) => s === "late").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">الحضور والغياب</h1>
        <p className="text-sm text-gray-500">سجّل حضور القسم في أقل من دقيقة</p>
      </div>

      {/* شريط الاختيار */}
      <div className="card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              القسم
            </label>
            <select
              className="input-field"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={loadingClasses}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              التاريخ
            </label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              رقم الحصة
            </label>
            <input
              type="number"
              min={1}
              className="input-field"
              value={sessionNumber}
              onChange={(e) => setSessionNumber(Number(e.target.value) || 1)}
            />
          </div>
        </div>
      </div>

      {loadingClasses ? (
        <Spinner />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="لا توجد أقسام بعد"
          description="أنشئ قسمًا أولًا من صفحة الأقسام قبل تسجيل الحضور"
        />
      ) : (
        <>
          {/* جدول تسجيل الحضور */}
          <div className="card">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4 text-sm text-gray-500">
                <span>
                  حاضر: <span className="font-semibold text-primary-600">{presentCount}</span>
                </span>
                <span>
                  غائب: <span className="font-semibold text-red-600">{absentCount}</span>
                </span>
                <span>
                  متأخر: <span className="font-semibold text-amber-600">{lateCount}</span>
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={markAllPresent} className="btn-secondary w-auto px-4">
                  <CheckCheck size={18} className="ml-1" />
                  تحديد الجميع حاضر
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary w-auto px-4">
                  <Save size={18} className="ml-1" />
                  {saving ? "جارٍ الحفظ..." : "حفظ الحضور"}
                </button>
              </div>
            </div>

            {loadingSession ? (
              <Spinner />
            ) : students.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="لا يوجد تلاميذ في هذا القسم"
                description="أضف تلاميذ إلى هذا القسم من صفحة التلاميذ"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800">
                    <tr>
                      <th className="px-3 py-2 font-medium">التلميذ</th>
                      <th className="px-3 py-2 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-3 py-2.5 font-medium">
                          <div className="flex items-center gap-2">
                            {student.first_name} {student.last_name}
                            {student.has_medical_exemption && (
                              <Stethoscope size={14} className="text-amber-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusToggle
                            value={statuses[student.id]}
                            onChange={(status) => setStudentStatus(student.id, status)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ملخص إحصائي + السجل التاريخي */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-3 text-base font-semibold">ملخص حضور القسم (كل الجلسات)</h3>
              {summary && summary.total > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-primary-50 p-3 text-center dark:bg-primary-950">
                    <p className="text-lg font-bold text-primary-700 dark:text-primary-300">
                      {summary.rate}%
                    </p>
                    <p className="text-xs text-gray-500">نسبة الحضور</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3 text-center dark:bg-red-950">
                    <p className="text-lg font-bold text-red-600">{summary.absent}</p>
                    <p className="text-xs text-gray-500">غياب</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-center dark:bg-amber-950">
                    <p className="text-lg font-bold text-amber-600">{summary.late}</p>
                    <p className="text-xs text-gray-500">تأخر</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-center dark:bg-blue-950">
                    <p className="text-lg font-bold text-blue-600">{summary.exempted}</p>
                    <p className="text-xs text-gray-500">إعفاء</p>
                  </div>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">
                  لا توجد بيانات حضور مسجّلة بعد لهذا القسم
                </p>
              )}
            </div>

            <div className="card">
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <History size={16} />
                آخر الجلسات
              </h3>
              {history.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">لا توجد جلسات سابقة</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((session) => (
                    <li
                      key={session.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800"
                    >
                      <span>
                        {new Date(session.session_date).toLocaleDateString("ar-DZ")}
                        {session.session_number > 1 && ` (حصة ${session.session_number})`}
                      </span>
                      <span
                        className={`font-semibold ${
                          session.rate >= 80
                            ? "text-primary-600"
                            : session.rate >= 50
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {session.rate}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
