"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#features", label: "المميزات" },
  { href: "#how-it-works", label: "كيف تعمل" },
  { href: "#ai", label: "الذكاء الاصطناعي" },
  { href: "#pricing", label: "الأسعار" },
  { href: "#faq", label: "الأسئلة الشائعة" },
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <span className="text-lg font-bold text-primary-700">EPS DZ PRO</span>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition hover:text-primary-700 dark:text-gray-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-primary-700 dark:text-gray-300"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            ابدأ مجانًا
          </Link>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-gray-600 lg:hidden dark:text-gray-300"
          aria-label="القائمة"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 lg:hidden dark:border-gray-800">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <Link href="/login" className="btn-secondary text-center">
                تسجيل الدخول
              </Link>
              <Link href="/signup" className="btn-primary text-center">
                ابدأ مجانًا
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
