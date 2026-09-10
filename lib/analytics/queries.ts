import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyPerformance, PERFORMANCE_LABELS } from "@/lib/evaluations/classification";

export type ChartPoint = { label: string; value: number };

export type OverallAnalytics = {
  attendanceRate: number;
  avgEvaluationScore: number;
  lessonsCount: number;
  documentsCount: number;
  studentsCount: number;
};

export async function getOverallAnalytics(
  supabase: SupabaseClient,
  teacherId: string
): Promise<OverallAnalytics> {
  const [attendanceRes, lessonsRes, documentsRes, studentsRes, evalResultsRes] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("status, attendance_sessions!inner(teacher_id)")
      .eq("attendance_sessions.teacher_id", teacherId),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("teacher_id", teacherId),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("teacher_id", teacherId),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("teacher_id", teacherId),
    supabase
      .from("evaluation_results")
      .select("score, evaluation_criteria!inner(max_score, evaluations!inner(teacher_id))")
      .eq("evaluation_criteria.evaluations.teacher_id", teacherId),
  ]);

  const records = (attendanceRes.data ?? []) as unknown as { status: string }[];
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  const evalRows = (evalResultsRes.data ?? []) as unknown as {
    score: number;
    evaluation_criteria: { max_score: number };
  }[];
  const avgEvaluationScore =
    evalRows.length > 0
      ? Math.round(
          (evalRows.reduce((sum, r) => sum + r.score / (r.evaluation_criteria.max_score || 1), 0) /
            evalRows.length) *
            100
        )
      : 0;

  return {
    attendanceRate,
    avgEvaluationScore,
    lessonsCount: lessonsRes.count ?? 0,
    documentsCount: documentsRes.count ?? 0,
    studentsCount: studentsRes.count ?? 0,
  };
}

export async function getAttendanceRateByClass(
  supabase: SupabaseClient,
  teacherId: string
): Promise<ChartPoint[]> {
  const { data: classes } = await supabase.from("classes").select("id, name").eq("teacher_id", teacherId);

  const points: ChartPoint[] = [];
  for (const cls of classes ?? []) {
    const { data } = await supabase
      .from("attendance_records")
      .select("status, attendance_sessions!inner(teacher_id, class_id)")
      .eq("attendance_sessions.teacher_id", teacherId)
      .eq("attendance_sessions.class_id", cls.id);

    const rows = (data ?? []) as unknown as { status: string }[];
    const total = rows.length;
    const present = rows.filter((r) => r.status === "present").length;
    if (total > 0) {
      points.push({ label: cls.name, value: Math.round((present / total) * 100) });
    }
  }
  return points;
}

export async function getEvaluationAverageByClass(
  supabase: SupabaseClient,
  teacherId: string
): Promise<ChartPoint[]> {
  const { data: classes } = await supabase.from("classes").select("id, name").eq("teacher_id", teacherId);

  const points: ChartPoint[] = [];
  for (const cls of classes ?? []) {
    const { data: evaluations } = await supabase
      .from("evaluations")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("class_id", cls.id);

    const evalIds = (evaluations ?? []).map((e) => e.id);
    if (evalIds.length === 0) continue;

    const { data: results } = await supabase
      .from("evaluation_results")
      .select("score, evaluation_criteria!inner(max_score, evaluation_id)")
      .in("evaluation_criteria.evaluation_id", evalIds);

    const rows = (results ?? []) as unknown as { score: number; evaluation_criteria: { max_score: number } }[];
    if (rows.length === 0) continue;

    const avgPercent =
      (rows.reduce((sum, r) => sum + r.score / (r.evaluation_criteria.max_score || 1), 0) / rows.length) * 100;
    points.push({ label: cls.name, value: Math.round(avgPercent) });
  }
  return points;
}

export async function getPerformanceDistribution(
  supabase: SupabaseClient,
  teacherId: string
): Promise<ChartPoint[]> {
  const { data } = await supabase
    .from("evaluation_results")
    .select("score, evaluation_criteria!inner(max_score, evaluations!inner(teacher_id))")
    .eq("evaluation_criteria.evaluations.teacher_id", teacherId);

  const rows = (data ?? []) as unknown as { score: number; evaluation_criteria: { max_score: number } }[];

  const counts: Record<string, number> = {
    excellent: 0,
    very_good: 0,
    good: 0,
    average: 0,
    needs_support: 0,
  };

  for (const row of rows) {
    const percent = (row.score / (row.evaluation_criteria.max_score || 1)) * 100;
    const level = classifyPerformance(percent);
    counts[level] += 1;
  }

  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ label: PERFORMANCE_LABELS[key as keyof typeof PERFORMANCE_LABELS], value }));
}
