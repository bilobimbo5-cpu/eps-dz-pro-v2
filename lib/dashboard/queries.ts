import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardStats = {
  schoolsCount: number;
  classesCount: number;
  studentsCount: number;
  lessonsCount: number;
  documentsCount: number;
  attendanceRate: number; // نسبة مئوية 0-100
  absencesCount: number;
};

export type ChartPoint = { label: string; value: number };

export type RecentActivityItem = {
  id: string;
  title: string;
  type: "lesson" | "document" | "evaluation";
  date: string;
};

/**
 * يجلب كل إحصائيات بطاقات لوحة التحكم بالتوازي.
 */
export async function getDashboardStats(
  supabase: SupabaseClient,
  teacherId: string
): Promise<DashboardStats> {
  const [
    schools,
    classes,
    students,
    lessons,
    documents,
    attendanceRecords,
  ] = await Promise.all([
    supabase
      .from("schools")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherId),
    supabase
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherId),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherId),
    supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherId),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherId),
    // الحضور: نجلب حالة كل سجل عبر ربط مع جلسات الأستاذ فقط
    supabase
      .from("attendance_records")
      .select("status, attendance_sessions!inner(teacher_id)")
      .eq("attendance_sessions.teacher_id", teacherId),
  ]);

  const records = (attendanceRecords.data ?? []) as unknown as { status: string }[];
  const total = records.length;
  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return {
    schoolsCount: schools.count ?? 0,
    classesCount: classes.count ?? 0,
    studentsCount: students.count ?? 0,
    lessonsCount: lessons.count ?? 0,
    documentsCount: documents.count ?? 0,
    attendanceRate,
    absencesCount: absentCount,
  };
}

/**
 * اتجاه الحضور عبر آخر N جلسة (لرسم بياني خطي).
 */
export async function getAttendanceTrend(
  supabase: SupabaseClient,
  teacherId: string,
  limit = 8
): Promise<ChartPoint[]> {
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("id, session_date")
    .eq("teacher_id", teacherId)
    .order("session_date", { ascending: false })
    .limit(limit);

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const { data: records } = await supabase
    .from("attendance_records")
    .select("status, attendance_session_id")
    .in("attendance_session_id", sessionIds);

  const points: ChartPoint[] = sessions
    .slice()
    .reverse()
    .map((session) => {
      const sessionRecords = (records ?? []).filter(
        (r) => r.attendance_session_id === session.id
      );
      const total = sessionRecords.length;
      const present = sessionRecords.filter((r) => r.status === "present").length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        label: new Date(session.session_date).toLocaleDateString("ar-DZ", {
          day: "2-digit",
          month: "2-digit",
        }),
        value: rate,
      };
    });

  return points;
}

/**
 * عدد التلاميذ في كل قسم (لرسم بياني بالأعمدة).
 */
export async function getStudentsPerClass(
  supabase: SupabaseClient,
  teacherId: string
): Promise<ChartPoint[]> {
  const { data } = await supabase
    .from("classes")
    .select("name, student_count")
    .eq("teacher_id", teacherId)
    .order("name")
    .limit(8);

  return (data ?? []).map((c) => ({ label: c.name, value: c.student_count ?? 0 }));
}

/**
 * متوسط نتائج آخر التقييمات (لرسم بياني بالأعمدة).
 */
export async function getEvaluationAverages(
  supabase: SupabaseClient,
  teacherId: string
): Promise<ChartPoint[]> {
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("id, title")
    .eq("teacher_id", teacherId)
    .order("eval_date", { ascending: false })
    .limit(6);

  if (!evaluations || evaluations.length === 0) return [];

  const results = await Promise.all(
    evaluations.map(async (evalRow) => {
      const { data: scores } = await supabase
        .from("evaluation_results")
        .select("score, evaluation_criteria!inner(evaluation_id, max_score)")
        .eq("evaluation_criteria.evaluation_id", evalRow.id);

      const rows = (scores ?? []) as unknown as {
        score: number;
        evaluation_criteria: { max_score: number };
      }[];
      if (rows.length === 0) return { label: evalRow.title, value: 0 };

      const avgPercent =
        rows.reduce((sum, r) => sum + (r.score / (r.evaluation_criteria.max_score || 1)) * 100, 0) /
        rows.length;

      return { label: evalRow.title, value: Math.round(avgPercent) };
    })
  );

  return results.reverse();
}

/**
 * توزيع الأقسام حسب المستوى (لرسم بياني دائري).
 */
export async function getClassesByLevel(
  supabase: SupabaseClient,
  teacherId: string
): Promise<ChartPoint[]> {
  const { data } = await supabase
    .from("classes")
    .select("level_id, levels(code)")
    .eq("teacher_id", teacherId);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const code = (row as unknown as { levels: { code: string } | null }).levels?.code ?? "غير محدد";
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

/**
 * آخر الأنشطة (حصص + وثائق) لعرضها في قسم "آخر الأنشطة".
 */
export async function getRecentActivity(
  supabase: SupabaseClient,
  teacherId: string,
  limit = 5
): Promise<RecentActivityItem[]> {
  const [lessons, documents] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, objective, session_date, created_at")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("documents")
      .select("id, title, created_at")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: RecentActivityItem[] = [
    ...(lessons.data ?? []).map((l) => ({
      id: l.id,
      title: l.objective || "حصة بدون عنوان",
      type: "lesson" as const,
      date: l.created_at,
    })),
    ...(documents.data ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      type: "document" as const,
      date: d.created_at,
    })),
  ];

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
