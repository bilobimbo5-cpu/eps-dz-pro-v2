import { redirect } from "next/navigation";
import { CheckCircle2, Crown, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import UpgradeButton from "@/components/subscription/UpgradeButton";

const PLAN_LABELS: Record<string, string> = { free: "مجاني", basic: "أساسي", pro: "احترافي" };
const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  expired: "منتهي",
  cancelled: "ملغى",
  pending: "قيد الانتظار",
};

const PLANS = [
  {
    key: "free" as const,
    name: "مجاني",
    price: "0 دج",
    features: ["إدارة مؤسسة واحدة وحتى 3 أقسام", "الحضور والتخطيط الأساسي", "5 وثائق شهريًا"],
  },
  {
    key: "basic" as const,
    name: "أساسي",
    price: "قريبًا",
    features: ["أقسام ومؤسسات غير محدودة", "كل أنواع الوثائق", "تصدير Excel/CSV", "دعم فني عبر البريد"],
  },
  {
    key: "pro" as const,
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
    .select("plan, status, payment_status, start_date, end_date, requested_plan, upgrade_requested_at")
    .eq("teacher_id", user.id)
    .maybeSingle();

  const currentPlan = subscription?.plan ?? "free";
  const requestedPlan = subscription?.requested_plan ?? null;

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
        {requestedPlan && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Clock size={14} />
            طلبت الترقية إلى &quot;{PLAN_LABELS[requestedPlan]}&quot; — بانتظار موافقة الإدارة
          </div>
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

              {isCurrent ? (
                <button disabled className="btn-secondary mt-5 disabled:opacity-60">
                  الخطة الحالية
                </button>
              ) : plan.key === "free" ? (
                <button disabled className="btn-secondary mt-5 disabled:opacity-60">
                  خطة أساسية
                </button>
              ) : (
                <UpgradeButton
                  planKey={plan.key}
                  planLabel={plan.name}
                  alreadyRequested={requestedPlan === plan.key}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400">
        الدفع الفعلي عبر وسائل جزائرية غير مفعّل بعد — طلب الترقية يُرسَل للإدارة للمعالجة يدويًا حاليًا.
      </p>
    </div>
  );
}
