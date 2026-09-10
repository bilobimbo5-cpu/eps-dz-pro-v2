import {
  CalendarRange,
  ClipboardCheck,
  ListChecks,
  FileText,
  Sparkles,
  BarChart3,
} from "lucide-react";

const FEATURES = [
  {
    icon: CalendarRange,
    title: "التخطيط والحصص",
    description:
      "من التخطيط السنوي إلى بناء الحصة بمكوناتها السبعة — كل شيء منظّم ومترابط.",
  },
  {
    icon: ClipboardCheck,
    title: "الحضور في أقل من دقيقة",
    description: "سجّل حضور 30 تلميذًا بضغطة واحدة، وعدّل الاستثناءات فقط.",
  },
  {
    icon: ListChecks,
    title: "شبكات التقويم الذكية",
    description: "بناء معايير التقييم، وحساب النتائج والمستوى تلقائيًا لكل تلميذ.",
  },
  {
    icon: FileText,
    title: "مركز الوثائق البيداغوجية",
    description: "أدخل بياناتك مرة واحدة، ودع المنصة تُنشئ لك كل الوثائق التي تحتاجها.",
  },
  {
    icon: Sparkles,
    title: "المساعد الذكي",
    description: "صف الحصة التي تريدها بلغة طبيعية، واحصل على مسودة كاملة قابلة للتعديل.",
  },
  {
    icon: BarChart3,
    title: "إحصائيات شاملة",
    description: "تتبّع أداء تلاميذك وأقسامك برسوم بيانية واضحة ومحدّثة لحظيًا.",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          كل ما تحتاجه في مكان واحد
        </h2>
        <p className="mt-3 text-gray-500">
          مصمّمة لتناسب إيقاع عمل أستاذ التربية البدنية اليومي، من المكتب إلى الميدان
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-100 p-6 transition hover:border-primary-200 hover:shadow-md dark:border-gray-800"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
