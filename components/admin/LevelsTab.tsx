"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

type LevelRow = {
  id: string;
  code: string;
  label_ar: string;
  label_fr: string | null;
  sort_order: number;
  is_active: boolean;
};

export default function LevelsTab() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [form, setForm] = useState({ code: "", label_ar: "", label_fr: "" });
  const [saving, setSaving] = useState(false);

  const loadLevels = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("levels").select("*").order("sort_order");
    setLevels(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.label_ar.trim()) {
      toast.error("أدخل الرمز والتسمية العربية");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("levels").insert({
      code: form.code,
      label_ar: form.label_ar,
      label_fr: form.label_fr || null,
      sort_order: levels.length,
    });
    setSaving(false);
    if (error) {
      toast.error("تعذّر إضافة المستوى (ربما الرمز مستخدم مسبقًا)");
      return;
    }
    toast.success("تمت إضافة المستوى");
    setForm({ code: "", label_ar: "", label_fr: "" });
    loadLevels();
  }

  async function toggleActive(level: LevelRow) {
    const { error } = await supabase
      .from("levels")
      .update({ is_active: !level.is_active })
      .eq("id", level.id);
    if (error) {
      toast.error("تعذّر التحديث");
      return;
    }
    loadLevels();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("levels").delete().eq("id", id);
    if (error) {
      toast.error("تعذّر الحذف (قد يكون مرتبطًا بأقسام موجودة)");
      return;
    }
    toast.success("تم الحذف");
    loadLevels();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <input
          className="input-field"
          placeholder="الرمز (مثال: 6AP)"
          dir="ltr"
          value={form.code}
          onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
        />
        <input
          className="input-field sm:col-span-2"
          placeholder="التسمية بالعربية"
          value={form.label_ar}
          onChange={(e) => setForm((p) => ({ ...p, label_ar: e.target.value }))}
        />
        <div className="flex gap-2">
          <input
            className="input-field"
            placeholder="بالفرنسية (اختياري)"
            value={form.label_fr}
            onChange={(e) => setForm((p) => ({ ...p, label_fr: e.target.value }))}
          />
          <button type="submit" disabled={saving} className="btn-primary w-auto shrink-0 px-3">
            <Plus size={18} />
          </button>
        </div>
      </form>

      {loading ? (
        <Spinner />
      ) : levels.length === 0 ? (
        <EmptyState icon={GraduationCap} title="لا توجد مستويات بعد" description="" />
      ) : (
        <ul className="space-y-2">
          {levels.map((level) => (
            <li
              key={level.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <div>
                <span className="font-semibold" dir="ltr">
                  {level.code}
                </span>
                <span className="mr-2 text-sm text-gray-500">{level.label_ar}</span>
                {level.label_fr && <span className="mr-2 text-xs text-gray-400">({level.label_fr})</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(level)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    level.is_active
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                  }`}
                >
                  {level.is_active ? "مفعّل" : "معطّل"}
                </button>
                <button
                  onClick={() => handleDelete(level.id)}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
