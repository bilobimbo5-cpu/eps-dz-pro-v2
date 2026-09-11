"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

export type ExerciseFormValues = {
  id?: string;
  name: string;
  activity_id: string;
  level_id: string;
  objective: string;
  student_count: number;
  equipment_needed: string;
  duration_minutes: number;
  organization: string;
  instructions: string;
  success_criteria: string;
};

function getDefaults(initialValues: ExerciseFormValues | undefined): ExerciseFormValues {
  return (
    initialValues ?? {
      name: "",
      activity_id: "",
      level_id: "",
      objective: "",
      student_count: 20,
      equipment_needed: "",
      duration_minutes: 10,
      organization: "",
      instructions: "",
      success_criteria: "",
    }
  );
}

export default function ExerciseFormModal({
  open,
  onClose,
  onSaved,
  teacherId,
  levels,
  activities,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
  levels: { id: string; code: string }[];
  activities: { id: string; name: string }[];
  initialValues?: ExerciseFormValues;
}) {
  const supabase = createClient();
  const isEdit = Boolean(initialValues?.id);

  const [values, setValues] = useState<ExerciseFormValues>(getDefaults(initialValues));

  useEffect(() => {
    if (open) {
      setValues(getDefaults(initialValues));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<ExerciseFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      toast.error("الرجاء إدخال اسم التمرين");
      return;
    }

    setSaving(true);
    const payload = {
      teacher_id: teacherId,
      name: values.name,
      activity_id: values.activity_id || null,
      level_id: values.level_id || null,
      objective: values.objective || null,
      student_count: values.student_count || null,
      equipment_needed: values.equipment_needed
        ? values.equipment_needed.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      duration_minutes: values.duration_minutes || null,
      organization: values.organization || null,
      instructions: values.instructions || null,
      success_criteria: values.success_criteria || null,
      is_public: false,
    };

    const { error } = isEdit
      ? await supabase.from("exercises").update(payload).eq("id", values.id)
      : await supabase.from("exercises").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }

    toast.success(isEdit ? "تم تحديث التمرين" : "تمت إضافة التمرين");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل التمرين" : "إضافة تمرين جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            اسم التمرين *
          </label>
          <input
            className="input-field"
            placeholder="مثال: سباق التتابع"
            value={values.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              عدد التلاميذ
            </label>
            <input
              type="number"
              className="input-field"
              value={values.student_count}
              onChange={(e) => patch({ student_count: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الزمن (د)
            </label>
            <input
              type="number"
              className="input-field"
              value={values.duration_minutes}
              onChange={(e) => patch({ duration_minutes: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            الهدف
          </label>
          <textarea
            className="input-field min-h-[60px]"
            value={values.objective}
            onChange={(e) => patch({ objective: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            الأدوات (افصل بينها بفاصلة)
          </label>
          <input
            className="input-field"
            value={values.equipment_needed}
            onChange={(e) => patch({ equipment_needed: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            التنظيم
          </label>
          <textarea
            className="input-field min-h-[60px]"
            value={values.organization}
            onChange={(e) => patch({ organization: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            التعليمات
          </label>
          <textarea
            className="input-field min-h-[60px]"
            value={values.instructions}
            onChange={(e) => patch({ instructions: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            معيار النجاح
          </label>
          <input
            className="input-field"
            value={values.success_criteria}
            onChange={(e) => patch({ success_criteria: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة التمرين"}
        </button>
      </form>
    </Modal>
  );
}
