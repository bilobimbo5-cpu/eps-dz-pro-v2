"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { School, Plus, Pencil, Trash2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SchoolFormModal, { type SchoolFormValues } from "@/components/schools/SchoolFormModal";

type SchoolRow = {
  id: string;
  name: string;
  commune: string | null;
  wilaya: string | null;
  director_name: string | null;
  phone: string | null;
  school_year_id: string | null;
  school_years: { label: string } | null;
};

export default function SchoolsPage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [schoolYears, setSchoolYears] = useState<{ id: string; label: string }[]>([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolFormValues | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<SchoolRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [schoolsRes, yearsRes] = await Promise.all([
      supabase
        .from("schools")
        .select("id, name, commune, wilaya, director_name, phone, school_year_id, school_years(label)")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false }),
      supabase
        .from("school_years")
        .select("id, label")
        .eq("teacher_id", teacherId)
        .order("start_date", { ascending: false }),
    ]);
    setSchools((schoolsRes.data ?? []) as unknown as SchoolRow[]);
    setSchoolYears(yearsRes.data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    setEditingSchool(undefined);
    setModalOpen(true);
  }

  function openEdit(school: SchoolRow) {
    setEditingSchool({
      id: school.id,
      name: school.name,
      address: "",
      commune: school.commune ?? "",
      wilaya: school.wilaya ?? "",
      director_name: school.director_name ?? "",
      phone: school.phone ?? "",
      email: "",
      school_year_id: school.school_year_id ?? "",
    });
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("schools").delete().eq("id", deleteTarget.id);
    setDeleting(false);

    if (error) {
      toast.error("تعذّر حذف المؤسسة (قد تحتوي على أقسام مرتبطة)");
      return;
    }
    toast.success("تم حذف المؤسسة");
    setDeleteTarget(null);
    loadData();
  }

  const filtered = schools.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">المؤسسات</h1>
          <p className="text-sm text-gray-500">إدارة المدارس التي تعمل بها</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5">
          <Plus size={18} className="ml-1" />
          إضافة مؤسسة
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pr-9"
          placeholder="ابحث باسم المؤسسة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto p-0">
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={School}
            title={search ? "لا توجد نتائج" : "لا توجد مؤسسات بعد"}
            description={
              search
                ? "جرّب كلمة بحث أخرى"
                : "أضف أول مؤسسة لتبدأ بإنشاء الأقسام والتلاميذ"
            }
            actionLabel={search ? undefined : "إضافة مؤسسة"}
            onAction={search ? undefined : openCreate}
          />
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium">الاسم</th>
                <th className="px-4 py-3 font-medium">البلدية / الولاية</th>
                <th className="px-4 py-3 font-medium">المدير</th>
                <th className="px-4 py-3 font-medium">الهاتف</th>
                <th className="px-4 py-3 font-medium">الموسم</th>
                <th className="px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium">{school.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {[school.commune, school.wilaya].filter(Boolean).join(" - ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{school.director_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500" dir="ltr">
                    {school.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {school.school_years?.label || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(school)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="تعديل"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(school)}
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

      <SchoolFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        teacherId={teacherId}
        schoolYears={schoolYears}
        initialValues={editingSchool}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف المؤسسة"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ سيتم حذف كل الأقسام والتلاميذ المرتبطين بها. لا يمكن التراجع عن هذا الإجراء.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
