"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

export type ActivityFormValues = {
  id?: string;
  name: string;
  domain: string;
  level_id: string;
  objective: string;
  skills: string;
  equipment_needed: string;
  duration_minutes: number;
  difficulty: "easy" | "medium" | "hard";
  pedagogical_notes: string;
};

const DIFFICULTY_LABELS: Record<ActivityFormValues["difficulty"], string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

export default function ActivityFormModal({
  open,
  onClose,
  onSaved,
  teacherId,
  levels,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
  levels: { id: string; code: string }[];
  initialValues?: ActivityFormValues;
}) {
  const supabase = createClient();
  const isEdit = Boolean(initialValues?.id);

  const [values, setValues] = useState<ActivityFormValues>(
    initialValues ?? {
      name: "",
      domain: "",
      level_id: "",
      objective: "",
      skills: "",
      equipment_needed: "",
      duration_minutes: 30,
      difficulty: "medium",
      pedagogical_notes: "",
    }
  );
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<ActivityFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      toast.error("الرجاء إدخال اسم النشاط");
      return;
    }

    setSaving(true);
    const payload = {
      teacher_id: teacherId,
      name: values.name,
      domain: values.domain || null,
      level_id: values.level_id || null,
      objective: values.objective || null,
      skills: values.skills ? values.skills.split(",").map((s) => s.trim()).filter(Boolean) : null,
      equipment_needed: values.equipment_needed
        ? values.equipment_needed.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      duration_minutes: values.duration_minutes || null,
      difficulty: values.difficulty,
      pedagogical_notes: values.pedagogical_notes || null,
      is_public: false,
    };

    const { error } = isEdit
      ? await supabase.from("activities").update(payload).eq("id", values.id)
      : await supabase.from("activities").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }

    toast.success(isEdit ? "تم تحديث النشاط" : "تمت إضافة النشاط");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل النشاط" : "إضافة نشاط جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              اسم النشاط *
            </label>
            <input
              className="input-field"
              placeholder="مثال: الجري السريع"
              value={values.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              المجال
            </label>
            <input
              className="input-field"
              placeholder="مثال: الجري والوثب"
              value={values.domain}
              onChange={(e) => patch({ domain: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              المدة (د)
            </label>
            <input
              type="number"
              className="input-field"
              value={values.duration_minutes}
              onChange={(e) => patch({ duration_minutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الصعوبة
            </label>
            <select
              className="input-field"
              value={values.difficulty}
              onChange={(e) => patch({ difficulty: e.target.value as ActivityFormValues["difficulty"] })}
            >
              {(Object.keys(DIFFICULTY_LABELS) as ActivityFormValues["difficulty"][]).map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
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
            المهارات (افصل بينها بفاصلة)
          </label>
          <input
            className="input-field"
            placeholder="التوازن، السرعة، التنسيق"
            value={values.skills}
            onChange={(e) => patch({ skills: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            الأدوات المطلوبة (افصل بينها بفاصلة)
          </label>
          <input
            className="input-field"
            placeholder="أقماع، صافرة، كرات"
            value={values.equipment_needed}
            onChange={(e) => patch({ equipment_needed: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            ملاحظات تربوية
          </label>
          <textarea
            className="input-field min-h-[60px]"
            value={values.pedagogical_notes}
            onChange={(e) => patch({ pedagogical_notes: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة النشاط"}
        </button>
      </form>
    </Modal>
  );
}
