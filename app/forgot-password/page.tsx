"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error("حدث خطأ، حاول مرة أخرى");
      return;
    }

    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary-700">EPS DZ PRO</h1>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">استعادة كلمة المرور</h2>

          {sent ? (
            <p className="rounded-xl bg-primary-50 p-4 text-sm text-primary-800 dark:bg-primary-950 dark:text-primary-200">
              تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. تحقق من صندوق
              الوارد (أو البريد غير المرغوب فيه).
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500">
                أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
              </p>
              <input
                type="email"
                required
                dir="ltr"
                className="input-field text-left"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500">
            <Link href="/login" className="font-medium text-primary-600 hover:underline">
              العودة إلى تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
