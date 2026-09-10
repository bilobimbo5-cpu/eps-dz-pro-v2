import type { SupabaseClient } from "@supabase/supabase-js";

export type AttendanceStatus = "present" | "absent" | "late" | "exempted";

export type StudentForAttendance = {
  id: string;
  first_name: string;
  last_name: string;
  has_medical_exemption: boolean;
};

/**
 * تلاميذ القسم النشطون، مرتبون بالاسم، لعرضهم في شاشة تسجيل الحضور.
 */
export async function getClassStudents(
  supabase: SupabaseClient,
  classId: string
): Promise<StudentForAttendance[]> {
  const { data } = await supabase
    .from("students")
    .select("id, first_name, last_name, has_medical_exemption")
    .eq("class_id", classId)
    .eq("status", "active")
    .order("first_name");

  return data ?? [];
}

/**
 * يجلب جلسة حضور موجودة (إن وُجدت) مع حالة كل تلميذ.
 * إن لم توجد جلسة بعد لهذا القسم/التاريخ/رقم الحصة، يعيد sessionId=null وسجلات فارغة.
 */
export async function getSessionRecords(
  supabase: SupabaseClient,
  teacherId: string,
  classId: string,
  date: string,
  sessionNumber: number
): Promise<{ sessionId: string | null; records: Record<string, AttendanceStatus> }> {
  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("class_id", classId)
    .eq("session_date", date)
    .eq("session_number", sessionNumber)
    .maybeSingle();

  if (!session) {
    return { sessionId: null, records: {} };
  }

  const { data: recordRows } = await supabase
    .from("attendance_records")
    .select("student_id, status")
    .eq("attendance_session_id", session.id);

  const records: Record<string, AttendanceStatus> = {};
  for (const row of recordRows ?? []) {
    records[row.student_id] = row.status as AttendanceStatus;
  }

  return { sessionId: session.id, records };
}

/**
 * ينشئ الجلسة إن لم تكن موجودة، ثم يحفظ (upsert) حالة كل تلميذ.
 */
export async function saveAttendanceSession(
  supabase: SupabaseClient,
  params: {
    teacherId: string;
    classId: string;
    date: string;
    sessionNumber: number;
    statuses: Record<string, AttendanceStatus>;
  }
): Promise<{ error: string | null }> {
  const { teacherId, classId, date, sessionNumber, statuses } = params;

  // 1) إنشاء الجلسة أو جلب معرّفها إن كانت موجودة مسبقًا
  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .upsert(
      {
        teacher_id: teacherId,
        class_id: classId,
        session_date: date,
        session_number: sessionNumber,
      },
      { onConflict: "teacher_id,class_id,session_date,session_number" }
    )
    .select("id")
    .single();

  if (sessionError || !session) {
    return { error: sessionError?.message ?? "تعذّر إنشاء جلسة الحضور" };
  }

  // 2) حفظ حالة كل تلميذ
  const rows = Object.entries(statuses).map(([studentId, status]) => ({
    attendance_session_id: session.id,
    student_id: studentId,
    status,
  }));

  if (rows.length === 0) {
    return { error: null };
  }

  const { error: recordsError } = await supabase
    .from("attendance_records")
    .upsert(rows, { onConflict: "attendance_session_id,student_id" });

  if (recordsError) {
    return { error: recordsError.message };
  }

  return { error: null };
}

export type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  exempted: number;
  rate: number;
};

/**
 * ملخص إحصائي شامل لحضور قسم معيّن (كل الجلسات المسجّلة).
 */
export async function getClassAttendanceSummary(
  supabase: SupabaseClient,
  teacherId: string,
  classId: string
): Promise<AttendanceSummary> {
  const { data } = await supabase
    .from("attendance_records")
    .select("status, attendance_sessions!inner(teacher_id, class_id)")
    .eq("attendance_sessions.teacher_id", teacherId)
    .eq("attendance_sessions.class_id", classId);

  const rows = (data ?? []) as unknown as { status: AttendanceStatus }[];
  const total = rows.length;
  const present = rows.filter((r) => r.status === "present").length;
  const absent = rows.filter((r) => r.status === "absent").length;
  const late = rows.filter((r) => r.status === "late").length;
  const exempted = rows.filter((r) => r.status === "exempted").length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, absent, late, exempted, rate };
}

export type SessionHistoryItem = {
  id: string;
  session_date: string;
  session_number: number;
  rate: number;
  total: number;
};

/**
 * آخر جلسات الحضور المسجّلة لقسم معيّن، مع نسبة الحضور لكل جلسة.
 */
export async function getRecentSessions(
  supabase: SupabaseClient,
  teacherId: string,
  classId: string,
  limit = 10
): Promise<SessionHistoryItem[]> {
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("id, session_date, session_number")
    .eq("teacher_id", teacherId)
    .eq("class_id", classId)
    .order("session_date", { ascending: false })
    .limit(limit);

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const { data: records } = await supabase
    .from("attendance_records")
    .select("attendance_session_id, status")
    .in("attendance_session_id", sessionIds);

  return sessions.map((session) => {
    const sessionRecords = (records ?? []).filter(
      (r) => r.attendance_session_id === session.id
    );
    const total = sessionRecords.length;
    const present = sessionRecords.filter((r) => r.status === "present").length;
    return {
      id: session.id,
      session_date: session.session_date,
      session_number: session.session_number,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  });
}
