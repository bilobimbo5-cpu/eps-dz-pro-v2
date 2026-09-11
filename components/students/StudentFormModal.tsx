"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

export type StudentFormValues = {
  id?: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: "male" | "female" | "";
  class_id: string;
  internal_number: string;
  status: "active" | "transferred" | "inactive";
  has_medical_exemption: boolean;
  exemption_reason: string;
  exemption_start: string;
  exemption_end: string;
  notes: string;
};

const EMPTY_VALUES: StudentFormValues = {
  first_name: "",
  last_name: "",
  birth_date: "",
  gender: "",
  class_id: "",
  internal_number: "",
  status: "active",
  has_medical_exemption: false,
  exemption_reason: "",
  exemption_start: "",
  exemption_end: "",
  notes: "",
};

function getDefaults(
  initialValues: StudentFormValues | undefined,
  defaultClassId: string | undefined,
  classes: { id: string; name: string }[]
): StudentFormValues {
  return (
    initialValues ?? {
      ...EMPTY_VALUES,
      class_id: defaultClassId ?? classes[0]?.id ?? "",
    }
  );
}

export default function StudentFormModal({
  open,
  onClose,
  onSaved,
  teacherId,
  classes,
  defaultClassId,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
  classes: { id: string; name: string }[];
  defaultClassId?: string;
  initialValues?: StudentFormValues;
}) {
  const supabase = createClient();
  const isEdit = Boolean(initialValues?.id);

  const [values, setValues] = useState<StudentFormValues>(
    getDefaults(initialValues, defaultClassId, classes)
  );

  useEffect(() => {
    if (open) {
      setValues(getDefaults(initialValues, defaultClassId, classes));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<StudentFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.first_name.trim() || !values.last_name.trim() || !values.class_id) {
      toast.error("الرجاء إكمال الاسم واللقب والقسم");
      return;
    }

    setSaving(true);
    const payload = {
      teacher_id: teacherId,
      first_name: values.first_name,
      last_name: values.last_name,
      birth_date: values.birth_date || null,
      gender: values.gender || null,
      class_id: values.class_id,
      internal_number: values.internal_number || null,
      status: values.status,
      has_medical_exemption: values.has_medical_exemption,
      exemption_reason: values.has_medical_exemption ? values.exemption_reason || null : null,
      exemption_start: values.has_medical_exemption ? values.exemption_start || null : null,
      exemption_end: values.has_medical_exemption ? values.exemption_end || null : null,
      notes: values.notes || null,
    };

    const { error } = isEdit
      ? await supabase.from("students").update(payload).eq("id", values.id)
      : await supabase.from("students").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }

    toast.success(isEdit ? "تم تحديث بيانات التلميذ" : "تمت إضافة التلميذ");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل بيانات التلميذ" : "إضافة تلميذ جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الاسم *
            </label>
            <input
              className="input-field"
              value={values.first_name}
              onChange={(e) => patch({ first_name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              اللقب *
            </label>
            <input
              className="input-field"
              value={values.last_name}
              onChange={(e) => patch({ last_name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              تاريخ الميلاد
            </label>
            <input
              type="date"
              className="input-field"
              value={values.birth_date}
              onChange={(e) => patch({ birth_date: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الجنس
            </label>
            <select
              className="input-field"
              value={values.gender}
              onChange={(e) => patch({ gender: e.target.value as StudentFormValues["gender"] })}
            >
              <option value="">غير محدد</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
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
              <option value="">اختر القسم...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              رقم داخلي
            </label>
            <input
              dir="ltr"
              className="input-field text-left"
              value={values.internal_number}
              onChange={(e) => patch({ internal_number: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            حالة التلميذ
          </label>
          <select
            className="input-field"
            value={values.status}
            onChange={(e) => patch({ status: e.target.value as StudentFormValues["status"] })}
          >
            <option value="active">نشط</option>
            <option value="transferred">منتقل</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>

        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={values.has_medical_exemption}
              onChange={(e) => patch({ has_medical_exemption: e.target.checked })}
            />
            لديه إعفاء طبي
          </label>

          {values.has_medical_exemption && (
            <div className="mt-3 space-y-3">
              <input
                className="input-field"
                placeholder="سبب الإعفاء"
                value={values.exemption_reason}
                onChange={(e) => patch({ exemption_reason: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="input-field"
                  value={values.exemption_start}
                  onChange={(e) => patch({ exemption_start: e.target.value })}
                />
                <input
                  type="date"
                  className="input-field"
                  value={values.exemption_end}
                  onChange={(e) => patch({ exemption_end: e.target.value })}
                />
              </div>
            </div>
          )}
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
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة التلميذ"}
        </button>
      </form>
    </Modal>
  );
}
