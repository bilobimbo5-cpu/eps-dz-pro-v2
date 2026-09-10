import type { SupabaseClient } from "@supabase/supabase-js";

const MONTHS_AR = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

/**
 * قائمة التلاميذ: تُبنى تلقائيًا من جدول students لقسم معيّن.
 */
export async function generateClassListData(supabase: SupabaseClient, classId: string) {
  const { data: classRow } = await supabase
    .from("classes")
    .select("name, schools(name), levels(code, label_ar)")
    .eq("id", classId)
    .single();

  const { data: students } = await supabase
    .from("students")
    .select("first_name, last_name, gender, internal_number, status, has_medical_exemption")
    .eq("class_id", classId)
    .order("first_name");

  const classInfo = classRow as unknown as {
    name: string;
    schools: { name: string } | null;
    levels: { code: string; label_ar: string } | null;
  };

  return {
    class_name: classInfo?.name ?? "",
    school_name: classInfo?.schools?.name ?? "",
    level_label: classInfo?.levels?.label_ar ?? "",
    students: (students ?? []).map((s, index) => ({
      index: index + 1,
      full_name: `${s.first_name} ${s.last_name}`,
      gender: s.gender === "male" ? "ذكر" : s.gender === "female" ? "أنثى" : "—",
      internal_number: s.internal_number ?? "—",
      status: s.status,
      has_medical_exemption: s.has_medical_exemption,
    })),
  };
}

/**
 * كشف الحضور الشهري: يُحسب تلقائيًا من attendance_sessions + attendance_records
 * لشهر وقسم معيّنين — لا إعادة إدخال يدوي.
 */
export async function generateMonthlyAttendanceData(
  supabase: SupabaseClient,
  teacherId: string,
  classId: string,
  year: number,
  month: number
) {
  const { data: classRow } = await supabase
    .from("classes")
    .select("name, schools(name)")
    .eq("id", classId)
    .single();

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("id, session_date")
    .eq("teacher_id", teacherId)
    .eq("class_id", classId)
    .gte("session_date", monthStart)
    .lte("session_date", monthEnd)
    .order("session_date");

  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .eq("class_id", classId)
    .eq("status", "active")
    .order("first_name");

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: records } = sessionIds.length
    ? await supabase
        .from("attendance_records")
        .select("student_id, status, attendance_session_id")
        .in("attendance_session_id", sessionIds)
    : { data: [] };

  const studentsSummary = (students ?? []).map((student) => {
    const studentRecords = (records ?? []).filter((r) => r.student_id === student.id);
    const total = studentRecords.length;
    const present = studentRecords.filter((r) => r.status === "present").length;
    const absent = studentRecords.filter((r) => r.status === "absent").length;
    const late = studentRecords.filter((r) => r.status === "late").length;
    const exempted = studentRecords.filter((r) => r.status === "exempted").length;
    return {
      full_name: `${student.first_name} ${student.last_name}`,
      present,
      absent,
      late,
      exempted,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  });

  const classInfo = classRow as unknown as { name: string; schools: { name: string } | null };

  return {
    class_name: classInfo?.name ?? "",
    school_name: classInfo?.schools?.name ?? "",
    month_label: `${MONTHS_AR[month - 1]} ${year}`,
    sessions_count: sessions?.length ?? 0,
    students: studentsSummary,
  };
}

/**
 * مذكرة بيداغوجية للحصة: تُملأ تلقائيًا من حصة محفوظة سابقًا في Session Builder.
 */
export async function generateLessonNoteData(supabase: SupabaseClient, lessonId: string) {
  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "*, classes(name, schools(name)), activities(name), learning_units(title)"
    )
    .eq("id", lessonId)
    .single();

  if (!lesson) return null;

  const classInfo = lesson.classes as unknown as { name: string; schools: { name: string } | null };
  const activityInfo = lesson.activities as unknown as { name: string } | null;
  const unitInfo = lesson.learning_units as unknown as { title: string } | null;

  return {
    class_name: classInfo?.name ?? "",
    school_name: classInfo?.schools?.name ?? "",
    activity_name: activityInfo?.name ?? "",
    unit_title: unitInfo?.title ?? "",
    session_date: lesson.session_date,
    duration_minutes: lesson.duration_minutes,
    objective: lesson.objective,
    competency: lesson.competency,
    starting_situation: lesson.starting_situation,
    warm_up: lesson.warm_up,
    teaching_situation_1: lesson.teaching_situation_1,
    teaching_situation_2: lesson.teaching_situation_2,
    integration_situation: lesson.integration_situation,
    evaluation: lesson.evaluation,
    cool_down: lesson.cool_down,
    organization: lesson.organization,
    success_criteria: lesson.success_criteria,
    notes: lesson.notes,
  };
}

/**
 * شبكة تقويم (تشخيصي/تكويني/ختامي): تُملأ تلقائيًا من نتائج محفوظة في وحدة التقويم.
 */
export async function generateEvaluationGridData(supabase: SupabaseClient, evaluationId: string) {
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("title, eval_type, eval_date, classes(name, schools(name)), activities(name)")
    .eq("id", evaluationId)
    .single();

  if (!evaluation) return null;

  const { data: criteria } = await supabase
    .from("evaluation_criteria")
    .select("id, criterion, indicator, max_score")
    .eq("evaluation_id", evaluationId)
    .order("sort_order");

  const criteriaList = criteria ?? [];
  const maxTotal = criteriaList.reduce((sum, c) => sum + c.max_score, 0);

  // نجلب معرّف القسم بشكل صريح لاستعمال طلاب هذا القسم فقط
  const { data: evalRowWithClassId } = await supabase
    .from("evaluations")
    .select("class_id")
    .eq("id", evaluationId)
    .single();

  const { data: classStudents } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .eq("class_id", evalRowWithClassId?.class_id)
    .eq("status", "active")
    .order("first_name");

  const { data: results } = await supabase
    .from("evaluation_results")
    .select("student_id, criterion_id, score")
    .in("criterion_id", criteriaList.map((c) => c.id));

  const classInfo = evaluation.classes as unknown as { name: string; schools: { name: string } | null };
  const activityInfo = evaluation.activities as unknown as { name: string } | null;

  const studentsData = (classStudents ?? []).map((student) => {
    const studentResults = (results ?? []).filter((r) => r.student_id === student.id);
    const total = studentResults.reduce((sum, r) => sum + r.score, 0);
    const percent = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
    return {
      full_name: `${student.first_name} ${student.last_name}`,
      scores: criteriaList.map(
        (c) => studentResults.find((r) => r.criterion_id === c.id)?.score ?? 0
      ),
      total,
      percent,
    };
  });

  return {
    title: evaluation.title,
    eval_type: evaluation.eval_type,
    eval_date: evaluation.eval_date,
    class_name: classInfo?.name ?? "",
    school_name: classInfo?.schools?.name ?? "",
    activity_name: activityInfo?.name ?? "",
    criteria: criteriaList.map((c) => ({ label: c.criterion, max_score: c.max_score })),
    max_total: maxTotal,
    students: studentsData,
  };
}
