"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

export type ClassFormValues = {
  id?: string;
  name: string;
  school_id: string;
  level_id: string;
  student_count: number;
  notes: string;
};

export default function ClassFormModal({
  open,
  onClose,
  onSaved,
  teacherId,
  schools,
  levels,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
  schools: { id: string; name: string }[];
  levels: { id: string; code: string; label_ar: string }[];
  initialValues?: ClassFormValues;
}) {
  const supabase = createClient();
  const isEdit = Boolean(initialValues?.id);

  const [values, setValues] = useState<ClassFormValues>(
    initialValues ?? {
      name: "",
      school_id: schools[0]?.id ?? "",
      level_id: levels[0]?.id ?? "",
      student_count: 0,
      notes: "",
    }
  );
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<ClassFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim() || !values.school_id || !values.level_id) {
      toast.error("الرجاء إكمال اسم القسم والمؤسسة والمستوى");
      return;
    }

    setSaving(true);
    const payload = {
      teacher_id: teacherId,
      name: values.name,
      school_id: values.school_id,
      level_id: values.level_id,
      student_count: Number(values.student_count) || 0,
      notes: values.notes || null,
    };

    const { error } = isEdit
      ? await supabase.from("classes").update(payload).eq("id", values.id)
      : await supabase.from("classes").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }

    toast.success(isEdit ? "تم تحديث القسم" : "تمت إضافة القسم");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل القسم" : "إنشاء قسم جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            اسم القسم *
          </label>
          <input
            dir="ltr"
            className="input-field text-left"
            placeholder="مثال: 4AP1"
            value={values.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            المؤسسة *
          </label>
          <select
            className="input-field"
            value={values.school_id}
            onChange={(e) => patch({ school_id: e.target.value })}
          >
            <option value="">اختر المؤسسة...</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              المستوى *
            </label>
            <select
              className="input-field"
              value={values.level_id}
              onChange={(e) => patch({ level_id: e.target.value })}
            >
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} - {l.label_ar}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              عدد التلاميذ التقريبي
            </label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={values.student_count}
              onChange={(e) => patch({ student_count: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            ملاحظات
          </label>
          <textarea
            className="input-field min-h-[80px]"
            value={values.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إنشاء القسم"}
        </button>
      </form>
    </Modal>
  );
}
