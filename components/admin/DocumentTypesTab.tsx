"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

type DocTypeRow = {
  id: string;
  code: string;
  category: string;
  label_ar: string;
  label_fr: string | null;
  is_active: boolean;
};

const CATEGORIES = [
  "planning", "lesson", "evaluation", "attendance", "classes",
  "student", "follow_up", "report", "activity", "equipment", "safety", "yearly",
];

const CATEGORY_LABELS: Record<string, string> = {
  planning: "التخطيط والتنظيم",
  lesson: "المذكرات والبطاقات",
  evaluation: "التقويم والمتابعة",
  attendance: "الحضور والغياب",
  classes: "الأقسام والأفواج",
  student: "وثائق التلميذ",
  follow_up: "المتابعة البيداغوجية",
  report: "التقارير",
  activity: "الأنشطة والفعاليات",
  equipment: "العتاد والوسائل",
  safety: "السلامة والتنظيم",
  yearly: "الوثائق السنوية",
};

export default function DocumentTypesTab() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<DocTypeRow[]>([]);
  const [form, setForm] = useState({ code: "", label_ar: "", category: CATEGORIES[0] });
  const [saving, setSaving] = useState(false);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("document_types").select("*").order("category");
    setTypes(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.label_ar.trim()) {
      toast.error("أدخل الرمز والتسمية");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("document_types").insert({
      code: form.code,
      label_ar: form.label_ar,
      category: form.category,
    });
    setSaving(false);
    if (error) {
      toast.error("تعذّر الإضافة (ربما الرمز مستخدم مسبقًا)");
      return;
    }
    toast.success("تمت إضافة نوع الوثيقة");
    setForm({ code: "", label_ar: "", category: CATEGORIES[0] });
    loadTypes();
  }

  async function toggleActive(type: DocTypeRow) {
    const { error } = await supabase
      .from("document_types")
      .update({ is_active: !type.is_active })
      .eq("id", type.id);
    if (error) {
      toast.error("تعذّر التحديث");
      return;
    }
    loadTypes();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("document_types").delete().eq("id", id);
    if (error) {
      toast.error("تعذّر الحذف (قد توجد وثائق مرتبطة بهذا النوع)");
      return;
    }
    toast.success("تم الحذف");
    loadTypes();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <input
          className="input-field"
          placeholder="الرمز (بالإنجليزية)"
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
          <select
            className="input-field"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <button type="submit" disabled={saving} className="btn-primary w-auto shrink-0 px-3">
            <Plus size={18} />
          </button>
        </div>
      </form>

      {loading ? (
        <Spinner />
      ) : types.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد أنواع وثائق بعد" description="" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-3 py-2 font-medium">التسمية</th>
                <th className="px-3 py-2 font-medium">الفئة</th>
                <th className="px-3 py-2 font-medium">الرمز</th>
                <th className="px-3 py-2 font-medium">الحالة</th>
                <th className="px-3 py-2 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {types.map((type) => (
                <tr key={type.id}>
                  <td className="px-3 py-2 font-medium">{type.label_ar}</td>
                  <td className="px-3 py-2 text-gray-500">{CATEGORY_LABELS[type.category]}</td>
                  <td className="px-3 py-2 text-gray-400" dir="ltr">
                    {type.code}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleActive(type)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        type.is_active
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                      }`}
                    >
                      {type.is_active ? "مفعّل" : "معطّل"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleDelete(type.id)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
