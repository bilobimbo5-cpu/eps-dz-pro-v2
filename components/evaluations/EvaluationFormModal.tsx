"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

export type EvaluationFormValues = {
  id?: string;
  title: string;
  class_id: string;
  activity_id: string;
  eval_type: "diagnostic" | "formative" | "summative";
  term: number | "";
  eval_date: string;
};

const TYPE_LABELS: Record<EvaluationFormValues["eval_type"], string> = {
  diagnostic: "تشخيصي",
  formative: "تكويني",
  summative: "ختامي",
};

export default function EvaluationFormModal({
  open,
  onClose,
  onSaved,
  teacherId,
  classes,
  activities,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (evaluationId: string) => void;
  teacherId: string;
  classes: { id: string; name: string }[];
  activities: { id: string; name: string }[];
  initialValues?: EvaluationFormValues;
}) {
  const supabase = createClient();
  const isEdit = Boolean(initialValues?.id);

  const [values, setValues] = useState<EvaluationFormValues>(
    initialValues ?? {
      title: "",
      class_id: classes[0]?.id ?? "",
      activity_id: "",
      eval_type: "formative",
      term: "",
      eval_date: new Date().toISOString().slice(0, 10),
    }
  );
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<EvaluationFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim() || !values.class_id) {
      toast.error("الرجاء إدخال العنوان واختيار القسم");
      return;
    }

    setSaving(true);
    const payload = {
      teacher_id: teacherId,
      title: values.title,
      class_id: values.class_id,
      activity_id: values.activity_id || null,
      eval_type: values.eval_type,
      term: values.term === "" ? null : values.term,
      eval_date: values.eval_date || null,
    };

    const query = isEdit
      ? supabase.from("evaluations").update(payload).eq("id", values.id).select().single()
      : supabase.from("evaluations").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }

    toast.success(isEdit ? "تم تحديث التقويم" : "تم إنشاء التقويم");
    onSaved(data.id);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل التقويم" : "إنشاء تقويم جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            عنوان التقويم *
          </label>
          <input
            className="input-field"
            placeholder="مثال: تقويم مهارة الوثب - الفصل الأول"
            value={values.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            نوع التقويم
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TYPE_LABELS) as EvaluationFormValues["eval_type"][]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => patch({ eval_type: type })}
                className={`rounded-xl border py-2 text-xs font-medium transition ${
                  values.eval_type === type
                    ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950"
                    : "border-gray-200 text-gray-500 dark:border-gray-800"
                }`}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              القسم *
            </label>
            <select
              className="input-field"
              value={values.class_id}
              onChange={(e) => patch({ class_id: e.target.value })}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              النشاط
            </label>
            <select
              className="input-field"
              value={values.activity_id}
              onChange={(e) => patch({ activity_id: e.target.value })}
            >
              <option value="">بدون تحديد</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الفصل
            </label>
            <select
              className="input-field"
              value={values.term}
              onChange={(e) => patch({ term: e.target.value ? Number(e.target.value) : "" })}
            >
              <option value="">بدون تحديد</option>
              <option value={1}>الفصل الأول</option>
              <option value={2}>الفصل الثاني</option>
              <option value={3}>الفصل الثالث</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              التاريخ
            </label>
            <input
              type="date"
              className="input-field"
              value={values.eval_date}
              onChange={(e) => patch({ eval_date: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إنشاء ومتابعة بناء الشبكة"}
        </button>
      </form>
    </Modal>
  );
}
