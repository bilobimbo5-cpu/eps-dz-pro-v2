import type { SupabaseClient } from "@supabase/supabase-js";

export type PlatformStats = {
  usersCount: number;
  activeUsersCount: number;
  subscribersCount: number;
  expiredSubscriptionsCount: number;
  documentsCount: number;
  studentsCount: number;
  schoolsCount: number;
};

/**
 * إحصائيات على مستوى المنصة كاملة (كل الأساتذة). يعتمد على أن المستخدم الحالي
 * admin بحيث تسمح سياسات RLS بالوصول لكل الصفوف (انظر is_admin() في الـ schema).
 */
export async function getPlatformStats(supabase: SupabaseClient): Promise<PlatformStats> {
  const [
    users,
    activeUsers,
    subscribers,
    expiredSubs,
    documents,
    students,
    schools,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .in("plan", ["basic", "pro"])
      .eq("status", "active"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "expired"),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("schools").select("id", { count: "exact", head: true }),
  ]);

  return {
    usersCount: users.count ?? 0,
    activeUsersCount: activeUsers.count ?? 0,
    subscribersCount: subscribers.count ?? 0,
    expiredSubscriptionsCount: expiredSubs.count ?? 0,
    documentsCount: documents.count ?? 0,
    studentsCount: students.count ?? 0,
    schoolsCount: schools.count ?? 0,
  };
}
