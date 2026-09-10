"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

export type EquipmentFormValues = {
  id?: string;
  name: string;
  type: string;
  quantity: number;
  condition: "good" | "medium" | "damaged" | "needs_repair";
  storage_location: string;
  acquisition_date: string;
  school_id: string;
  notes: string;
};

const CONDITION_LABELS: Record<EquipmentFormValues["condition"], string> = {
  good: "جيد",
  medium: "متوسط",
  damaged: "تالف",
  needs_repair: "بحاجة إلى إصلاح",
};

export default function EquipmentFormModal({
  open,
  onClose,
  onSaved,
  teacherId,
  schools,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
  schools: { id: string; name: string }[];
  initialValues?: EquipmentFormValues;
}) {
  const supabase = createClient();
  const isEdit = Boolean(initialValues?.id);

  const [values, setValues] = useState<EquipmentFormValues>(
    initialValues ?? {
      name: "",
      type: "",
      quantity: 1,
      condition: "good",
      storage_location: "",
      acquisition_date: "",
      school_id: schools[0]?.id ?? "",
      notes: "",
    }
  );
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<EquipmentFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      toast.error("الرجاء إدخال اسم العتاد");
      return;
    }

    setSaving(true);
    const payload = {
      teacher_id: teacherId,
      name: values.name,
      type: values.type || null,
      quantity: Number(values.quantity) || 0,
      condition: values.condition,
      storage_location: values.storage_location || null,
      acquisition_date: values.acquisition_date || null,
      school_id: values.school_id || null,
      notes: values.notes || null,
    };

    const { error } = isEdit
      ? await supabase.from("equipment").update(payload).eq("id", values.id)
      : await supabase.from("equipment").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }

    toast.success(isEdit ? "تم تحديث العتاد" : "تمت إضافة العتاد");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل العتاد" : "إضافة عتاد جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الاسم *
            </label>
            <input
              className="input-field"
              placeholder="مثال: كرات قدم"
              value={values.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              النوع
            </label>
            <input
              className="input-field"
              placeholder="مثال: كرات"
              value={values.type}
              onChange={(e) => patch({ type: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              العدد
            </label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={values.quantity}
              onChange={(e) => patch({ quantity: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الحالة
            </label>
            <select
              className="input-field"
              value={values.condition}
              onChange={(e) => patch({ condition: e.target.value as EquipmentFormValues["condition"] })}
            >
              {(Object.keys(CONDITION_LABELS) as EquipmentFormValues["condition"][]).map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              مكان التخزين
            </label>
            <input
              className="input-field"
              value={values.storage_location}
              onChange={(e) => patch({ storage_location: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              تاريخ الاقتناء
            </label>
            <input
              type="date"
              className="input-field"
              value={values.acquisition_date}
              onChange={(e) => patch({ acquisition_date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            المؤسسة
          </label>
          <select
            className="input-field"
            value={values.school_id}
            onChange={(e) => patch({ school_id: e.target.value })}
          >
            <option value="">بدون تحديد</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            ملاحظات
          </label>
          <textarea
            className="input-field min-h-[70px]"
            value={values.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة العتاد"}
        </button>
      </form>
    </Modal>
  );
}
