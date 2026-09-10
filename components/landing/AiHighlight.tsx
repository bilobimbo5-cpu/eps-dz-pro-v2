import { Sparkles, CheckCircle2 } from "lucide-react";

export default function AiHighlight() {
  return (
    <section id="ai" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid grid-cols-1 items-center gap-10 rounded-3xl bg-primary-600 p-8 sm:p-12 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            <Sparkles size={14} />
            المساعد الذكي
          </span>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            وفّر وقتك في تحضير الحصص
          </h2>
          <p className="mt-3 text-primary-50">
            اكتب طلبك بلغة طبيعية، مثل: "أنشئ لي حصة للسنة الرابعة حول الجري لمدة 45 دقيقة"،
            واحصل على مسودة كاملة بالمكونات السبعة لبنية الحصة — جاهزة للمراجعة والتعديل.
          </p>
          <ul className="mt-6 space-y-2">
            {[
              "توفير كبير في وقت التحضير",
              "مسودة قابلة للتعديل الكامل قبل الاستخدام",
              "لا يخترع بيانات تلاميذ حقيقية أبدًا",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-white">
                <CheckCircle2 size={16} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-xs font-medium text-gray-400">مثال على طلب</p>
          <p className="mt-1 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
            أنشئ لي حصة للسنة الثانية حول التوازن والتنسيق الحركي، 40 دقيقة
          </p>
          <p className="mt-4 text-xs font-medium text-gray-400">المسودة المولّدة</p>
          <div className="mt-1 space-y-2">
            <div className="rounded-xl bg-primary-50 p-3 text-xs text-primary-800">
              <span className="font-semibold">الهدف:</span> تطوير القدرة على الحفاظ على التوازن
              أثناء الحركة...
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              <span className="font-semibold">الإحماء:</span> جري خفيف مع تغييرات اتجاه...
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
