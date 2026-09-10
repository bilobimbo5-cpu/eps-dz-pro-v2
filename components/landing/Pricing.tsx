import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const PLANS = [
  {
    name: "مجاني",
    price: "0 دج",
    highlight: false,
    features: ["مؤسسة واحدة وحتى 3 أقسام", "الحضور والتخطيط الأساسي", "5 وثائق شهريًا"],
  },
  {
    name: "أساسي",
    price: "قريبًا",
    highlight: true,
    features: ["أقسام ومؤسسات غير محدودة", "كل أنواع الوثائق", "تصدير Excel/CSV", "دعم فني"],
  },
  {
    name: "احترافي",
    price: "قريبًا",
    highlight: false,
    features: ["كل مزايا الأساسي", "المساعد الذكي بدون حدود", "أولوية الدعم الفني"],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-gray-50 py-20 dark:bg-gray-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            أسعار بسيطة وواضحة
          </h2>
          <p className="mt-3 text-gray-500">ابدأ مجانًا، وارقَ عندما تحتاج مزيدًا من المساحة</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-2 border-primary-500 bg-white shadow-lg dark:bg-gray-900"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              }`}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</p>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
                }`}
              >
                ابدأ الآن
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
