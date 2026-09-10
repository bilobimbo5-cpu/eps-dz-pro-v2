const STEPS = [
  {
    number: "01",
    title: "أنشئ حسابك",
    description: "سجّل في دقيقتين وأخبرنا عن مؤسستك وأقسامك عبر معالج بسيط.",
  },
  {
    number: "02",
    title: "أضف تلاميذك",
    description: "يدويًا أو دفعة واحدة عبر استيراد ملف Excel أو CSV.",
  },
  {
    number: "03",
    title: "خطّط ودرّس",
    description: "ابنِ حصصك ووحداتك التعلمية، وسجّل الحضور والتقييمات أثناء العمل الميداني.",
  },
  {
    number: "04",
    title: "احصل على وثائقك",
    description: "المنصة تُنشئ لك المذكرات والكشوف والتقارير تلقائيًا من بياناتك.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-20 dark:bg-gray-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            كيف تعمل المنصة؟
          </h2>
          <p className="mt-3 text-gray-500">أربع خطوات بسيطة لتبدأ رحلتك الرقمية</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="relative">
              <span className="text-4xl font-extrabold text-primary-100 dark:text-primary-900">
                {step.number}
              </span>
              <h3 className="mt-2 font-semibold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
