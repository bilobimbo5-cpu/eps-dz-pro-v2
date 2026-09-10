import { redirect } from "next/navigation";
import { Users2, UserCheck, CreditCard, AlertTriangle, FileText, School } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPlatformStats } from "@/lib/admin/queries";
import StatCard from "@/components/dashboard/StatCard";
import AdminTabs from "@/components/admin/AdminTabs";

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const stats = await getPlatformStats(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">لوحة الإدارة</h1>
        <p className="text-sm text-gray-500">نظرة عامة على المنصة وإدارة محتواها</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Users2} label="المستخدمون" value={stats.usersCount} accent="blue" />
        <StatCard icon={UserCheck} label="النشطون" value={stats.activeUsersCount} accent="primary" />
        <StatCard icon={CreditCard} label="المشتركون" value={stats.subscribersCount} accent="primary" />
        <StatCard
          icon={AlertTriangle}
          label="اشتراكات منتهية"
          value={stats.expiredSubscriptionsCount}
          accent="red"
        />
        <StatCard icon={School} label="المؤسسات" value={stats.schoolsCount} accent="amber" />
        <StatCard icon={FileText} label="الوثائق" value={stats.documentsCount} accent="blue" />
      </div>

      <AdminTabs />
    </div>
  );
}
