"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { ALGERIA_WILAYAS } from "@/lib/constants/wilayas";
import Modal from "@/components/ui/Modal";

export type SchoolFormValues = {
  id?: string;
  name: string;
  address: string;
  commune: string;
  wilaya: string;
  director_name: string;
  phone: string;
  email: string;
  school_year_id: string;
};

function getDefaults(
  initialValues: SchoolFormValues | undefined,
  schoolYears: { id: string; label: string }[]
): SchoolFormValues {
  return (
    initialValues ?? {
      name: "",
      address: "",
      commune: "",
      wilaya: "",
      director_name: "",
      phone: "",
      email: "",
      school_year_id: schoolYears[0]?.id ?? "",
    }
  );
}

export default function SchoolFormModal({
  open,
  onClose,
  onSaved,
  teacherId,
  schoolYears,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
  schoolYears: { id: string; label: string }[];
  initialValues?: SchoolFormValues;
}) {
  const supabase = createClient();
  const isEdit = Boolean(initialValues?.id);

  const [values, setValues] = useState<SchoolFormValues>(
    getDefaults(initialValues, schoolYears)
  );

  useEffect(() => {
    if (open) {
      setValues(getDefaults(initialValues, schoolYears));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<SchoolFormValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      toast.error("الرجاء إدخال اسم المؤسسة");
      return;
    }

    setSaving(true);
    const payload = {
      teacher_id: teacherId,
      name: values.name,
      address: values.address || null,
      commune: values.commune || null,
      wilaya: values.wilaya || null,
      director_name: values.director_name || null,
      phone: values.phone || null,
      email: values.email || null,
      school_year_id: values.school_year_id || null,
    };

    const { error } = isEdit
      ? await supabase.from("schools").update(payload).eq("id", values.id)
      : await supabase.from("schools").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }

    toast.success(isEdit ? "تم تحديث المؤسسة" : "تمت إضافة المؤسسة");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل المؤسسة" : "إضافة مؤسسة جديدة"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            اسم المؤسسة *
          </label>
          <input
            className="input-field"
            value={values.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="مثال: مدرسة الإخوة هويبي"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الولاية
            </label>
            <select
              className="input-field"
              value={values.wilaya}
              onChange={(e) => patch({ wilaya: e.target.value })}
            >
              <option value="">اختر...</option>
              {ALGERIA_WILAYAS.map((w) => (
                <option key={w.code} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              البلدية
            </label>
            <input
              className="input-field"
              value={values.commune}
              onChange={(e) => patch({ commune: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            العنوان
          </label>
          <input
            className="input-field"
            value={values.address}
            onChange={(e) => patch({ address: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            مدير المؤسسة
          </label>
          <input
            className="input-field"
            value={values.director_name}
            onChange={(e) => patch({ director_name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الهاتف
            </label>
            <input
              dir="ltr"
              className="input-field text-left"
              value={values.phone}
              onChange={(e) => patch({ phone: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              البريد الإلكتروني
            </label>
            <input
              dir="ltr"
              type="email"
              className="input-field text-left"
              value={values.email}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            الموسم الدراسي
          </label>
          <select
            className="input-field"
            value={values.school_year_id}
            onChange={(e) => patch({ school_year_id: e.target.value })}
          >
            <option value="">بدون تحديد</option>
            {schoolYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة المؤسسة"}
        </button>
      </form>
    </Modal>
  );
}
