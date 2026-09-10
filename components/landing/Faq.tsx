"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "هل المنصة مجانية؟",
    a: "نعم، الخطة المجانية تكفي لمؤسسة واحدة وحتى 3 أقسام مع كل الوظائف الأساسية. يمكنك الترقية لاحقًا عند الحاجة لمساحة أكبر.",
  },
  {
    q: "هل تعمل المنصة على الهاتف؟",
    a: "نعم، المنصة مصمّمة أولًا للهاتف (Mobile First) وقابلة للتثبيت كتطبيق مباشرة من المتصفح دون الحاجة لمتجر تطبيقات.",
  },
  {
    q: "ماذا يحدث إن انقطع الإنترنت أثناء الحصة؟",
    a: "تسجيل الحضور يعمل حتى دون اتصال — بياناتك تُحفظ محليًا وتُزامَن تلقائيًا فور عودة الاتصال.",
  },
  {
    q: "هل بياناتي وبيانات تلاميذي آمنة؟",
    a: "نعم، كل أستاذ يرى بياناته فقط عبر نظام صلاحيات صارم على مستوى قاعدة البيانات، ولا يمكن لأستاذ آخر الوصول إليها.",
  },
  {
    q: "هل يمكنني استيراد قائمة تلاميذي من Excel؟",
    a: "نعم، يمكنك استيراد التلاميذ دفعة واحدة من ملف Excel أو CSV مباشرة من صفحة التلاميذ.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          الأسئلة الشائعة
        </h2>
      </div>

      <div className="mt-10 space-y-3">
        {FAQS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white"
              >
                {item.q}
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <p className="px-5 pb-4 text-sm text-gray-500">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
