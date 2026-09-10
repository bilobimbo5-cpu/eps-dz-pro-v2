import type { SupabaseClient } from "@supabase/supabase-js";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * يفحص حالة الأستاذ الحالية (حصص اليوم، حضور غير مسجّل، اشتراك قارب على
 * الانتهاء) ويُنشئ إشعارات جديدة عند الحاجة فقط — لا يُكرر إشعارًا موجودًا
 * بالفعل عن نفس الحدث في نفس اليوم.
 */
export async function generateSmartNotifications(
  supabase: SupabaseClient,
  teacherId: string
): Promise<void> {
  const today = todayIso();

  const { data: existingToday } = await supabase
    .from("notifications")
    .select("type, title")
    .eq("teacher_id", teacherId)
    .gte("created_at", `${today}T00:00:00`);

  const alreadyNotified = (type: string, title: string) =>
    (existingToday ?? []).some((n) => n.type === type && n.title === title);

  const toInsert: { teacher_id: string; type: string; title: string; message: string }[] = [];

  // 1) حصص اليوم الجاهزة: تذكير بالحصة
  const { data: todayLessons } = await supabase
    .from("lessons")
    .select("id, objective, class_id, classes(name)")
    .eq("teacher_id", teacherId)
    .eq("session_date", today)
    .in("status", ["ready", "draft"]);

  for (const lesson of todayLessons ?? []) {
    const className = (lesson.classes as unknown as { name: string } | null)?.name ?? "";
    const title = `حصة اليوم: ${lesson.objective}`;
    if (!alreadyNotified("lesson_reminder", title)) {
      toInsert.push({
        teacher_id: teacherId,
        type: "lesson_reminder",
        title,
        message: `لديك حصة مبرمجة اليوم للقسم ${className}. لا تنسَ فتحها من Session Builder.`,
      });
    }
  }

  // 2) حصص اليوم بدون تسجيل حضور: تذكير بالحضور
  const { data: todaySessions } = await supabase
    .from("attendance_sessions")
    .select("class_id")
    .eq("teacher_id", teacherId)
    .eq("session_date", today);

  const classesWithAttendance = new Set((todaySessions ?? []).map((s) => s.class_id));
  const classesWithLessonsToday = new Set((todayLessons ?? []).map((l) => l.class_id).filter(Boolean));

  for (const classId of classesWithLessonsToday) {
    if (!classId || classesWithAttendance.has(classId)) continue;
    const title = "لم يُسجَّل الحضور بعد اليوم";
    if (!alreadyNotified("attendance_reminder", title)) {
      toInsert.push({
        teacher_id: teacherId,
        type: "attendance_reminder",
        title,
        message: "لديك قسم بحصة اليوم لم يُسجَّل حضوره بعد. سجّله في أقل من دقيقة من صفحة الحضور.",
      });
      break; // إشعار واحد يكفي حتى لا نُغرق الأستاذ بإشعارات متكررة
    }
  }

  // 3) اشتراك قارب على الانتهاء (خلال 7 أيام)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("end_date, plan, status")
    .eq("teacher_id", teacherId)
    .maybeSingle();

  if (subscription?.end_date && subscription.status === "active") {
    const daysLeft = Math.ceil(
      (new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft >= 0 && daysLeft <= 7) {
      const title = "اشتراكك قارب على الانتهاء";
      if (!alreadyNotified("subscription_expiry", title)) {
        toInsert.push({
          teacher_id: teacherId,
          type: "subscription_expiry",
          title,
          message: `تبقّى ${daysLeft} يوم على انتهاء اشتراكك. جدّده لتفادي فقدان الوصول إلى مميزاته.`,
        });
      }
    }
  }

  if (toInsert.length > 0) {
    await supabase.from("notifications").insert(toInsert);
  }
}
