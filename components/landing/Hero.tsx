import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white dark:from-primary-950 dark:via-gray-950 dark:to-gray-950">
      {/* زخرفة خلفية بسيطة */}
      <div className="pointer-events-none absolute -top-24 right-1/2 h-96 w-96 translate-x-1/2 rounded-full bg-primary-200/40 blur-3xl dark:bg-primary-800/20" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-6 inline-block rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            مصمّمة خصيصًا لأساتذة التربية البدنية في الجزائر
          </span>

          <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-5xl dark:text-white">
            منصة رقمية ذكية لأستاذ
            <br />
            <span className="text-primary-600">التربية البدنية والرياضية</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base text-gray-600 sm:text-lg dark:text-gray-300">
            خطط، درّس، قيّم، تابع، وأنشئ وثائقك البيداغوجية من مكان واحد.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary w-full sm:w-auto sm:px-8">
              ابدأ مجانًا
              <ArrowLeft size={18} className="mr-1" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              <PlayCircle size={18} />
              شاهد كيف تعمل المنصة
            </a>
          </div>
        </div>

        {/* لقطة تصورية للوحة التحكم */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">
              {[
                { label: "الأقسام", value: "12" },
                { label: "التلاميذ", value: "348" },
                { label: "نسبة الحضور", value: "94%" },
                { label: "الوثائق", value: "56" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-primary-50 p-4 text-center dark:bg-primary-950"
                >
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2">
              <div className="h-32 rounded-xl bg-gray-50 dark:bg-gray-800" />
              <div className="h-32 rounded-xl bg-gray-50 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
