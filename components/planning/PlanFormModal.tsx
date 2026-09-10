"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

export type PlanFormValues = {
  id?: string;
  plan_type: "annual" | "term" | "monthly" | "weekly";
  school_year_id: string;
  level_id: string;
  class_id: string;
  term: number | "";
  month: number | "";
  title: string;
  notes: string;
};

const PLAN_TYPE_LABELS: Record<PlanFormValues["plan_type"], string> = {
  annual: "سنوي",
  term: "فصلي",
  monthly: "شهري",
  weekly: "أسبوعي",
};

const MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function PlanFormModal({
  open,
  onClose,
  onSaved,
  teacherId,
  schoolYears,
  levels,
  classes,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
  schoolYears: { id: string; label: string }[];
  levels: { id: string; code: string; label_ar: string }[];
  classes: { id: string; name: string }[];
  initialValues?: PlanFormValues;
}) {
  const supabase = createClient();
  const isEdit = Boolean(initialValues?.id);

  const [values, setValues] = useState<PlanFormValues>(
    initialValues ?? {
      plan_type: "annual",
      school_year_id: schoolYears[0]?.id ?? "",
      level_id: "",
      class_id: "",
      term: "",
      month: "",
      title: "",
      notes: "",
    }
  );
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<PlanFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim() || !values.school_year_id) {
      toast.error("الرجاء إدخال العنوان واختيار الموسم الدراسي");
      return;
    }

    setSaving(true);
    const payload = {
      teacher_id: teacherId,
      plan_type: values.plan_type,
      school_year_id: values.school_year_id,
      level_id: values.level_id || null,
      class_id: values.class_id || null,
      term: values.term === "" ? null : values.term,
      month: values.month === "" ? null : values.month,
      content: { title: values.title, notes: values.notes },
    };

    const { error } = isEdit
      ? await supabase.from("lesson_plans").update(payload).eq("id", values.id)
      : await supabase.from("lesson_plans").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }

    toast.success(isEdit ? "تم تحديث الخطة" : "تمت إضافة الخطة");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل الخطة" : "إضافة خطة جديدة"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            نوع التخطيط
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(PLAN_TYPE_LABELS) as PlanFormValues["plan_type"][]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => patch({ plan_type: type })}
                className={`rounded-xl border py-2 text-xs font-medium transition ${
                  values.plan_type === type
                    ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950"
                    : "border-gray-200 text-gray-500 dark:border-gray-800"
                }`}
              >
                {PLAN_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            عنوان الخطة *
          </label>
          <input
            className="input-field"
            placeholder="مثال: التوزيع السنوي للنشاطات - 4AP"
            value={values.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الموسم الدراسي *
            </label>
            <select
              className="input-field"
              value={values.school_year_id}
              onChange={(e) => patch({ school_year_id: e.target.value })}
            >
              {schoolYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              المستوى
            </label>
            <select
              className="input-field"
              value={values.level_id}
              onChange={(e) => patch({ level_id: e.target.value })}
            >
              <option value="">كل المستويات</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {values.plan_type === "term" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الفصل
            </label>
            <select
              className="input-field"
              value={values.term}
              onChange={(e) => patch({ term: e.target.value ? Number(e.target.value) : "" })}
            >
              <option value="">اختر...</option>
              <option value={1}>الفصل الأول</option>
              <option value={2}>الفصل الثاني</option>
              <option value={3}>الفصل الثالث</option>
            </select>
          </div>
        )}

        {values.plan_type === "monthly" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الشهر
            </label>
            <select
              className="input-field"
              value={values.month}
              onChange={(e) => patch({ month: e.target.value ? Number(e.target.value) : "" })}
            >
              <option value="">اختر...</option>
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            القسم (اختياري)
          </label>
          <select
            className="input-field"
            value={values.class_id}
            onChange={(e) => patch({ class_id: e.target.value })}
          >
            <option value="">كل الأقسام</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            محتوى الخطة
          </label>
          <textarea
            className="input-field min-h-[120px]"
            placeholder="فصّل الأنشطة والوحدات المبرمجة لهذه الفترة..."
            value={values.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الخطة"}
        </button>
      </form>
    </Modal>
  );
}
