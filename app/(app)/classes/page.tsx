"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Users2, Plus, Pencil, Trash2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ClassFormModal, { type ClassFormValues } from "@/components/classes/ClassFormModal";

type ClassRow = {
  id: string;
  name: string;
  student_count: number;
  school_id: string;
  level_id: string;
  notes: string | null;
  schools: { name: string } | null;
  levels: { code: string; label_ar: string } | null;
};

export default function ClassesPage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [levels, setLevels] = useState<{ id: string; code: string; label_ar: string }[]>([]);
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassFormValues | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [classesRes, schoolsRes, levelsRes] = await Promise.all([
      supabase
        .from("classes")
        .select("id, name, student_count, school_id, level_id, notes, schools(name), levels(code, label_ar)")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false }),
      supabase.from("schools").select("id, name").eq("teacher_id", teacherId),
      supabase.from("levels").select("id, code, label_ar").eq("is_active", true).order("sort_order"),
    ]);
    setClasses((classesRes.data ?? []) as unknown as ClassRow[]);
    setSchools(schoolsRes.data ?? []);
    setLevels(levelsRes.data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    if (schools.length === 0) {
      toast.error("أضف مؤسسة أولًا قبل إنشاء قسم");
      return;
    }
    setEditingClass(undefined);
    setModalOpen(true);
  }

  function openEdit(cls: ClassRow) {
    setEditingClass({
      id: cls.id,
      name: cls.name,
      school_id: cls.school_id,
      level_id: cls.level_id,
      student_count: cls.student_count,
      notes: cls.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("classes").delete().eq("id", deleteTarget.id);
    setDeleting(false);

    if (error) {
      toast.error("تعذّر حذف القسم (قد يحتوي على تلاميذ)");
      return;
    }
    toast.success("تم حذف القسم");
    setDeleteTarget(null);
    loadData();
  }

  const filtered = classes.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesSchool = !schoolFilter || c.school_id === schoolFilter;
    return matchesSearch && matchesSchool;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">الأقسام</h1>
          <p className="text-sm text-gray-500">إدارة الأقسام حسب المؤسسة والمستوى</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5">
          <Plus size={18} className="ml-1" />
          إنشاء قسم
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pr-9"
            placeholder="ابحث باسم القسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field max-w-xs"
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
        >
          <option value="">كل المؤسسات</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users2}
            title={search || schoolFilter ? "لا توجد نتائج" : "لا توجد أقسام بعد"}
            description={
              search || schoolFilter
                ? "جرّب تغيير الفلاتر"
                : "أنشئ أول قسم لتبدأ بإضافة التلاميذ"
            }
            actionLabel={search || schoolFilter ? undefined : "إنشاء قسم"}
            onAction={search || schoolFilter ? undefined : openCreate}
          />
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium">القسم</th>
                <th className="px-4 py-3 font-medium">المستوى</th>
                <th className="px-4 py-3 font-medium">المؤسسة</th>
                <th className="px-4 py-3 font-medium">عدد التلاميذ</th>
                <th className="px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium" dir="ltr">
                    {cls.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{cls.levels?.code || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{cls.schools?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{cls.student_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(cls)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="تعديل"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cls)}
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

      <ClassFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        teacherId={teacherId}
        schools={schools}
        levels={levels}
        initialValues={editingClass}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف القسم"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ سيتم حذف كل التلاميذ المرتبطين به. لا يمكن التراجع عن هذا الإجراء.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
