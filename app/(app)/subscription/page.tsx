import { redirect } from "next/navigation";
import { CheckCircle2, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const PLAN_LABELS: Record<string, string> = { free: "مجاني", basic: "أساسي", pro: "احترافي" };
const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  expired: "منتهي",
  cancelled: "ملغى",
  pending: "قيد الانتظار",
};

const PLANS = [
  {
    key: "free",
    name: "مجاني",
    price: "0 دج",
    features: ["إدارة مؤسسة واحدة وحتى 3 أقسام", "الحضور والتخطيط الأساسي", "5 وثائق شهريًا"],
  },
  {
    key: "basic",
    name: "أساسي",
    price: "قريبًا",
    features: ["أقسام ومؤسسات غير محدودة", "كل أنواع الوثائق", "تصدير Excel/CSV", "دعم فني عبر البريد"],
  },
  {
    key: "pro",
    name: "احترافي",
    price: "قريبًا",
    features: ["كل مزايا الأساسي", "المساعد الذكي بدون حدود", "أولوية الدعم الفني", "نسخ احتياطي متقدم"],
  },
];

export default async function SubscriptionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, payment_status, start_date, end_date")
    .eq("teacher_id", user.id)
    .maybeSingle();

  const currentPlan = subscription?.plan ?? "free";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">الاشتراك</h1>
        <p className="text-sm text-gray-500">تفاصيل خطتك الحالية والخطط المتاحة</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">خطتك الحالية</p>
            <p className="text-lg font-bold">{PLAN_LABELS[currentPlan]}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              subscription?.status === "active"
                ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800"
            }`}
          >
            {STATUS_LABELS[subscription?.status ?? "active"]}
          </span>
        </div>
        {subscription?.end_date && (
          <p className="mt-3 text-sm text-gray-500">
            تنتهي في {new Date(subscription.end_date).toLocaleDateString("ar-DZ")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          return (
            <div
              key={plan.key}
              className={`card relative ${isCurrent ? "border-2 border-primary-500" : ""}`}
            >
              {isCurrent && (
                <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-1 text-xs font-medium text-white">
                  <Crown size={12} />
                  خطتك الحالية
                </span>
              )}
              <h3 className="font-semibold">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent || plan.key !== "free"}
                className="btn-secondary mt-5 disabled:opacity-60"
              >
                {isCurrent ? "الخطة الحالية" : "قريبًا"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400">
        وسائل الدفع الجزائرية ستُضاف في تحديث قادم. البنية التحتية للاشتراكات جاهزة الآن لاستقبالها.
      </p>
    </div>
  );
}
