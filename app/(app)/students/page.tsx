"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Users2, Plus, Pencil, Trash2, Search, Download, Upload, Eye, Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import { exportToCsv } from "@/lib/utils/csv";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StudentFormModal, { type StudentFormValues } from "@/components/students/StudentFormModal";
import ImportStudentsModal from "@/components/students/ImportStudentsModal";

type StudentRow = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  gender: "male" | "female" | null;
  class_id: string;
  internal_number: string | null;
  status: "active" | "transferred" | "inactive";
  has_medical_exemption: boolean;
  exemption_reason: string | null;
  exemption_start: string | null;
  exemption_end: string | null;
  notes: string | null;
  classes: { name: string } | null;
};

const STATUS_LABELS: Record<StudentRow["status"], string> = {
  active: "نشط",
  transferred: "منتقل",
  inactive: "غير نشط",
};

const STATUS_STYLES: Record<StudentRow["status"], string> = {
  active: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  transferred: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export default function StudentsPage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentFormValues | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [studentsRes, classesRes] = await Promise.all([
      supabase
        .from("students")
        .select(
          "id, first_name, last_name, birth_date, gender, class_id, internal_number, status, has_medical_exemption, exemption_reason, exemption_start, exemption_end, notes, classes(name)"
        )
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false }),
      supabase.from("classes").select("id, name").eq("teacher_id", teacherId),
    ]);
    setStudents((studentsRes.data ?? []) as unknown as StudentRow[]);
    setClasses(classesRes.data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    if (classes.length === 0) {
      toast.error("أضف قسمًا أولًا قبل إضافة تلميذ");
      return;
    }
    setEditingStudent(undefined);
    setModalOpen(true);
  }

  function openEdit(student: StudentRow) {
    setEditingStudent({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      birth_date: student.birth_date ?? "",
      gender: student.gender ?? "",
      class_id: student.class_id,
      internal_number: student.internal_number ?? "",
      status: student.status,
      has_medical_exemption: student.has_medical_exemption,
      exemption_reason: student.exemption_reason ?? "",
      exemption_start: student.exemption_start ?? "",
      exemption_end: student.exemption_end ?? "",
      notes: student.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("students").delete().eq("id", deleteTarget.id);
    setDeleting(false);

    if (error) {
      toast.error("تعذّر حذف التلميذ");
      return;
    }
    toast.success("تم حذف التلميذ");
    setDeleteTarget(null);
    loadData();
  }

  function handleExport() {
    if (filtered.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    exportToCsv(
      "قائمة_التلاميذ",
      filtered.map((s) => ({
        الاسم: s.first_name,
        اللقب: s.last_name,
        القسم: s.classes?.name ?? "",
        الجنس: s.gender === "male" ? "ذكر" : s.gender === "female" ? "أنثى" : "",
        "تاريخ الميلاد": s.birth_date ?? "",
        "الرقم الداخلي": s.internal_number ?? "",
        الحالة: STATUS_LABELS[s.status],
        "إعفاء طبي": s.has_medical_exemption ? "نعم" : "لا",
      }))
    );
    toast.success("تم تصدير الملف");
  }

  const filtered = students.filter((s) => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase());
    const matchesClass = !classFilter || s.class_id === classFilter;
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">التلاميذ</h1>
          <p className="text-sm text-gray-500">{students.length} تلميذ مسجّل</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (classes.length === 0) {
                toast.error("أضف قسمًا أولًا قبل الاستيراد");
                return;
              }
              setImportModalOpen(true);
            }}
            className="btn-secondary w-auto px-4"
          >
            <Upload size={18} className="ml-1" />
            استيراد
          </button>
          <button onClick={handleExport} className="btn-secondary w-auto px-4">
            <Download size={18} className="ml-1" />
            تصدير CSV
          </button>
          <button onClick={openCreate} className="btn-primary w-auto px-5">
            <Plus size={18} className="ml-1" />
            إضافة تلميذ
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pr-9"
            placeholder="ابحث بالاسم أو اللقب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field max-w-xs"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="">كل الأقسام</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="input-field max-w-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="transferred">منتقل</option>
          <option value="inactive">غير نشط</option>
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users2}
            title={search || classFilter || statusFilter ? "لا توجد نتائج" : "لا يوجد تلاميذ بعد"}
            description={
              search || classFilter || statusFilter
                ? "جرّب تغيير الفلاتر"
                : "أضف أول تلميذ لتبدأ بتسجيل الحضور والتقييمات"
            }
            actionLabel={search || classFilter || statusFilter ? undefined : "إضافة تلميذ"}
            onAction={search || classFilter || statusFilter ? undefined : openCreate}
          />
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium">الاسم الكامل</th>
                <th className="px-4 py-3 font-medium">القسم</th>
                <th className="px-4 py-3 font-medium">الجنس</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium">إعفاء طبي</th>
                <th className="px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{student.classes?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {student.gender === "male" ? "ذكر" : student.gender === "female" ? "أنثى" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[student.status]}`}
                    >
                      {STATUS_LABELS[student.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {student.has_medical_exemption ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Stethoscope size={14} /> نعم
                      </span>
                    ) : (
                      <span className="text-gray-400">لا</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/students/${student.id}`}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="عرض البطاقة"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => openEdit(student)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="تعديل"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(student)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        aria-label="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <StudentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        teacherId={teacherId}
        classes={classes}
        defaultClassId={classFilter || undefined}
        initialValues={editingStudent}
      />

      <ImportStudentsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={loadData}
        teacherId={teacherId}
        classes={classes}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف التلميذ"
        message={`هل أنت متأكد من حذف "${deleteTarget?.first_name} ${deleteTarget?.last_name}"؟ سيتم حذف كل سجلات الحضور والتقييمات المرتبطة به. لا يمكن التراجع عن هذا الإجراء.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
