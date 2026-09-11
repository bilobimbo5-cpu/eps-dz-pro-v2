"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

export type UnitFormValues = {
  id?: string;
  title: string;
  school_year_id: string;
  level_id: string;
  activity_id: string;
  term: number;
  objective: string;
  competency: string;
  sessions_count: number;
};

function getDefaults(
  initialValues: UnitFormValues | undefined,
  schoolYears: { id: string; label: string }[],
  levels: { id: string; code: string; label_ar: string }[],
  activities: { id: string; name: string }[]
): UnitFormValues {
  return (
    initialValues ?? {
      title: "",
      school_year_id: schoolYears[0]?.id ?? "",
      level_id: levels[0]?.id ?? "",
      activity_id: activities[0]?.id ?? "",
      term: 1,
      objective: "",
      competency: "",
      sessions_count: 4,
    }
  );
}

export default function UnitFormModal({
  open,
  onClose,
  onSaved,
  teacherId,
  schoolYears,
  levels,
  activities,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
  schoolYears: { id: string; label: string }[];
  levels: { id: string; code: string; label_ar: string }[];
  activities: { id: string; name: string }[];
  initialValues?: UnitFormValues;
}) {
  const supabase = createClient();
  const isEdit = Boolean(initialValues?.id);

  const [values, setValues] = useState<UnitFormValues>(
    getDefaults(initialValues, schoolYears, levels, activities)
  );

  useEffect(() => {
    if (open) {
      setValues(getDefaults(initialValues, schoolYears, levels, activities));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<UnitFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim() || !values.school_year_id || !values.level_id) {
      toast.error("الرجاء إكمال العنوان والموسم والمستوى");
      return;
    }

    setSaving(true);
    const payload = {
      teacher_id: teacherId,
      title: values.title,
      school_year_id: values.school_year_id,
      level_id: values.level_id,
      activity_id: values.activity_id || null,
      term: values.term,
      objective: values.objective || null,
      competency: values.competency || null,
      sessions_count: Number(values.sessions_count) || null,
    };

    const { error } = isEdit
      ? await supabase.from("learning_units").update(payload).eq("id", values.id)
      : await supabase.from("learning_units").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }

    toast.success(isEdit ? "تم تحديث الوحدة" : "تمت إضافة الوحدة التعلمية");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل الوحدة التعلمية" : "إضافة وحدة تعلمية"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            عنوان الوحدة *
          </label>
          <input
            className="input-field"
            placeholder="مثال: وحدة الجري السريع"
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
              الفصل
            </label>
            <select
              className="input-field"
              value={values.term}
              onChange={(e) => patch({ term: Number(e.target.value) })}
            >
              <option value={1}>الفصل الأول</option>
              <option value={2}>الفصل الثاني</option>
              <option value={3}>الفصل الثالث</option>
            </select>
          </div>
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

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            الكفاءة المستهدفة
          </label>
          <textarea
            className="input-field min-h-[70px]"
            value={values.competency}
            onChange={(e) => patch({ competency: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            الهدف التعلمي
          </label>
          <textarea
            className="input-field min-h-[70px]"
            value={values.objective}
            onChange={(e) => patch({ objective: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            عدد الحصص المقترح
          </label>
          <input
            type="number"
            min={1}
            className="input-field"
            value={values.sessions_count}
            onChange={(e) => patch({ sessions_count: Number(e.target.value) })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الوحدة"}
        </button>
      </form>
    </Modal>
  );
}
