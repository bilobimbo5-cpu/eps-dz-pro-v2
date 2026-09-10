"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({
  userId,
  initialFullName,
  initialPhone,
  initialLanguage,
}: {
  userId: string;
  initialFullName: string;
  initialPhone: string;
  initialLanguage: "ar" | "fr";
}) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [language, setLanguage] = useState(initialLanguage);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("الاسم لا يمكن أن يكون فارغًا");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName, phone: phone || null, language })
      .eq("id", userId);
    setSaving(false);

    if (error) {
      toast.error("تعذّر حفظ التغييرات");
      return;
    }
    toast.success("تم حفظ الملف الشخصي");
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="text-base font-semibold">الملف الشخصي</h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          الاسم واللقب
        </label>
        <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          رقم الهاتف
        </label>
        <input
          dir="ltr"
          className="input-field text-left"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          لغة الواجهة
        </label>
        <select
          className="input-field"
          value={language}
          onChange={(e) => setLanguage(e.target.value as "ar" | "fr")}
        >
          <option value="ar">العربية</option>
          <option value="fr">Français (قريبًا)</option>
        </select>
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-auto px-6">
        {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
      </button>
    </form>
  );
}
