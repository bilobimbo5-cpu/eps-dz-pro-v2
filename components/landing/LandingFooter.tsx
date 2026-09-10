import Link from "next/link";

export default function LandingFooter() {
  return (
    <>
      <section id="contact" className="mx-auto max-w-4xl px-4 pb-20 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          جاهز لتنظيم عملك البيداغوجي؟
        </h2>
        <p className="mt-3 text-gray-500">انضم إلى أساتذة التربية البدنية الذين وفّروا وقتهم مع EPS DZ PRO</p>
        <Link href="/signup" className="btn-primary mt-6 inline-flex w-auto px-8">
          ابدأ مجانًا الآن
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-10 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-right">
          <span className="text-sm font-bold text-primary-700">EPS DZ PRO</span>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} EPS DZ PRO — منصة مستقلة غير رسمية لأساتذة التربية البدنية في الجزائر
          </p>
        </div>
      </footer>
    </>
  );
}
