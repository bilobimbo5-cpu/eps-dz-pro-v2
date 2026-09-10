"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function PasswordForm() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      toast.error("تعذّر تغيير كلمة المرور");
      return;
    }
    toast.success("تم تغيير كلمة المرور بنجاح");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="text-base font-semibold">تغيير كلمة المرور</h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          كلمة المرور الجديدة
        </label>
        <input
          type="password"
          dir="ltr"
          className="input-field text-left"
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
          dir="ltr"
          className="input-field text-left"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-auto px-6">
        {saving ? "جارٍ الحفظ..." : "تغيير كلمة المرور"}
      </button>
    </form>
  );
}
