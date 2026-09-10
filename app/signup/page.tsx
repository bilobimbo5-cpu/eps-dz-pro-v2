"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    if (password.length < 8) {
      toast.error("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setLoading(false);
      console.error("Signup error:", error);
      toast.error(
        error.message.includes("already registered")
          ? "هذا البريد الإلكتروني مسجل مسبقًا"
          : `خطأ: ${error.message}`
      );
      return;
    }

    // ملاحظة: صفوف users وteacher_profiles تُنشأ تلقائيًا الآن عبر Postgres
    // trigger (on_auth_user_created) فور نجاح التسجيل في auth.users — لا حاجة
    // لإدراجها يدويًا من هنا، وهذا أكثر موثوقية من الاعتماد على استدعاء إضافي
    // من المتصفح قد يفشل بصمت (كما كان يحدث سابقًا مع سياسة RLS الناقصة).

    setLoading(false);
    toast.success("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب");
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary-700">EPS DZ PRO</h1>
          <p className="mt-1 text-sm text-gray-500">
            منصة أستاذ التربية البدنية والرياضية
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold">إنشاء حساب جديد</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الاسم واللقب
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="مثال: أحمد بن علي"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              dir="ltr"
              className="input-field text-left"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              dir="ltr"
              className="input-field text-left"
              placeholder="8 أحرف على الأقل"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              required
              dir="ltr"
              className="input-field text-left"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "جارٍ الإنشاء..." : "إنشاء حساب"}
          </button>

          <p className="text-center text-sm text-gray-500">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="font-medium text-primary-600 hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
