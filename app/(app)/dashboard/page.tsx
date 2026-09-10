import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  School,
  Users2,
  ClipboardCheck,
  CalendarRange,
  FileText,
  UserX,
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import {
  AttendanceTrendChart,
  StudentsPerClassChart,
  EvaluationAveragesChart,
  ClassesByLevelChart,
} from "@/components/dashboard/DashboardCharts";

import {
  getDashboardStats,
  getAttendanceTrend,
  getStudentsPerClass,
  getEvaluationAverages,
  getClassesByLevel,
  getRecentActivity,
} from "@/lib/dashboard/queries";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [stats, attendanceTrend, studentsPerClass, evaluationAverages, classesByLevel, recentActivity] =
    await Promise.all([
      getDashboardStats(supabase, user.id),
      getAttendanceTrend(supabase, user.id),
      getStudentsPerClass(supabase, user.id),
      getEvaluationAverages(supabase, user.id),
      getClassesByLevel(supabase, user.id),
      getRecentActivity(supabase, user.id),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">لوحة التحكم</h1>
        <p className="text-sm text-gray-500">نظرة عامة على عملك البيداغوجي</p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={School} label="المؤسسات" value={stats.schoolsCount} accent="blue" />
        <StatCard icon={Users2} label="الأقسام" value={stats.classesCount} accent="primary" />
        <StatCard icon={Users2} label="التلاميذ" value={stats.studentsCount} accent="primary" />
        <StatCard
          icon={ClipboardCheck}
          label="نسبة الحضور"
          value={`${stats.attendanceRate}%`}
          accent="amber"
        />
        <StatCard icon={UserX} label="الغيابات" value={stats.absencesCount} accent="red" />
        <StatCard icon={FileText} label="الوثائق" value={stats.documentsCount} accent="blue" />
      </div>

      {/* الأزرار السريعة */}
      <QuickActions />

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-base font-semibold">اتجاه الحضور (آخر الحصص)</h3>
          <AttendanceTrendChart data={attendanceTrend} />
        </div>
        <div className="card">
          <h3 className="mb-2 text-base font-semibold">عدد التلاميذ حسب القسم</h3>
          <StudentsPerClassChart data={studentsPerClass} />
        </div>
        <div className="card">
          <h3 className="mb-2 text-base font-semibold">متوسط نتائج آخر التقييمات</h3>
          <EvaluationAveragesChart data={evaluationAverages} />
        </div>
        <div className="card">
          <h3 className="mb-2 text-base font-semibold">توزيع الأقسام حسب المستوى</h3>
          <ClassesByLevelChart data={classesByLevel} />
        </div>
      </div>

      {/* آخر الأنشطة */}
      <RecentActivity items={recentActivity} />

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <CalendarRange size={14} />
        <span>
          هذه اللوحة مرتبطة مباشرة بقاعدة البيانات — الإحصائيات تُحسب من بياناتك الفعلية،
          ولا تظهر بيانات وهمية بعد ربط الحساب.
        </span>
      </div>
    </div>
  );
}
