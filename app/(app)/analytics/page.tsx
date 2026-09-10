import { redirect } from "next/navigation";
import { BarChart3, ClipboardCheck, ListChecks, FileText, Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";
import { ClassesByLevelChart } from "@/components/dashboard/DashboardCharts";
import PercentBarChart from "@/components/analytics/PercentBarChart";
import {
  getOverallAnalytics,
  getAttendanceRateByClass,
  getEvaluationAverageByClass,
  getPerformanceDistribution,
} from "@/lib/analytics/queries";

export default async function AnalyticsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [overall, attendanceByClass, evaluationByClass, performanceDistribution] = await Promise.all([
    getOverallAnalytics(supabase, user.id),
    getAttendanceRateByClass(supabase, user.id),
    getEvaluationAverageByClass(supabase, user.id),
    getPerformanceDistribution(supabase, user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">الإحصائيات</h1>
        <p className="text-sm text-gray-500">نظرة تحليلية شاملة على أداء تلاميذك وعملك البيداغوجي</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={Users2} label="التلاميذ" value={overall.studentsCount} accent="blue" />
        <StatCard icon={ClipboardCheck} label="نسبة الحضور العامة" value={`${overall.attendanceRate}%`} accent="primary" />
        <StatCard icon={ListChecks} label="متوسط الأداء العام" value={`${overall.avgEvaluationScore}%`} accent="amber" />
        <StatCard icon={BarChart3} label="الحصص المُنشأة" value={overall.lessonsCount} accent="blue" />
        <StatCard icon={FileText} label="الوثائق" value={overall.documentsCount} accent="primary" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-base font-semibold">نسبة الحضور حسب القسم</h3>
          <PercentBarChart data={attendanceByClass} tooltipLabel="نسبة الحضور" color="#158455" />
        </div>
        <div className="card">
          <h3 className="mb-2 text-base font-semibold">متوسط الأداء حسب القسم</h3>
          <PercentBarChart data={evaluationByClass} tooltipLabel="متوسط الأداء" color="#22a56a" />
        </div>
        <div className="card lg:col-span-2">
          <h3 className="mb-2 text-base font-semibold">توزيع مستويات الأداء (كل التقييمات)</h3>
          <ClassesByLevelChart data={performanceDistribution} />
        </div>
      </div>
    </div>
  );
}
