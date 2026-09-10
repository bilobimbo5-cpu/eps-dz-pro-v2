"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import UnitFormModal, { type UnitFormValues } from "@/components/units/UnitFormModal";

type UnitRow = {
  id: string;
  title: string;
  term: number;
  sessions_count: number | null;
  competency: string | null;
  objective: string | null;
  school_year_id: string;
  level_id: string;
  activity_id: string | null;
  levels: { code: string } | null;
  activities: { name: string } | null;
};

const TERM_LABELS: Record<number, string> = {
  1: "الفصل الأول",
  2: "الفصل الثاني",
  3: "الفصل الثالث",
};

export default function UnitsPage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [schoolYears, setSchoolYears] = useState<{ id: string; label: string }[]>([]);
  const [levels, setLevels] = useState<{ id: string; code: string; label_ar: string }[]>([]);
  const [activities, setActivities] = useState<{ id: string; name: string }[]>([]);
  const [termFilter, setTermFilter] = useState<number | "">("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitFormValues | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<UnitRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [unitsRes, yearsRes, levelsRes, activitiesRes] = await Promise.all([
      supabase
        .from("learning_units")
        .select(
          "id, title, term, sessions_count, competency, objective, school_year_id, level_id, activity_id, levels(code), activities(name)"
        )
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false }),
      supabase.from("school_years").select("id, label").eq("teacher_id", teacherId),
      supabase.from("levels").select("id, code, label_ar").eq("is_active", true).order("sort_order"),
      supabase
        .from("activities")
        .select("id, name")
        .or(`teacher_id.eq.${teacherId},is_public.eq.true`),
    ]);
    setUnits((unitsRes.data ?? []) as unknown as UnitRow[]);
    setSchoolYears(yearsRes.data ?? []);
    setLevels(levelsRes.data ?? []);
    setActivities(activitiesRes.data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    if (schoolYears.length === 0) {
      toast.error("لا يوجد موسم دراسي مسجّل");
      return;
    }
    setEditingUnit(undefined);
    setModalOpen(true);
  }

  function openEdit(unit: UnitRow) {
    setEditingUnit({
      id: unit.id,
      title: unit.title,
      school_year_id: unit.school_year_id,
      level_id: unit.level_id,
      activity_id: unit.activity_id ?? "",
      term: unit.term,
      objective: unit.objective ?? "",
      competency: unit.competency ?? "",
      sessions_count: unit.sessions_count ?? 4,
    });
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("learning_units").delete().eq("id", deleteTarget.id);
    setDeleting(false);

    if (error) {
      toast.error("تعذّر حذف الوحدة");
      return;
    }
    toast.success("تم حذف الوحدة");
    setDeleteTarget(null);
    loadData();
  }

  const filtered = units.filter((u) => !termFilter || u.term === termFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">الوحدات التعلمية</h1>
          <p className="text-sm text-gray-500">خطط وحداتك التعلمية قبل بناء الحصص</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5">
          <Plus size={18} className="ml-1" />
          إضافة وحدة
        </button>
      </div>

      <select
        className="input-field max-w-xs"
        value={termFilter}
        onChange={(e) => setTermFilter(e.target.value ? Number(e.target.value) : "")}
      >
        <option value="">كل الفصول</option>
        <option value={1}>الفصل الأول</option>
        <option value={2}>الفصل الثاني</option>
        <option value={3}>الفصل الثالث</option>
      </select>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title={termFilter ? "لا توجد وحدات في هذا الفصل" : "لا توجد وحدات تعلمية بعد"}
            description="أنشئ أول وحدة تعلمية لتبدأ ببناء الحصص المرتبطة بها"
            actionLabel="إضافة وحدة"
            onAction={openCreate}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((unit) => (
            <div key={unit.id} className="card">
              <div className="mb-2 flex items-start justify-between">
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {unit.levels?.code}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(unit)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(unit)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold">{unit.title}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {TERM_LABELS[unit.term]} · {unit.activities?.name || "بدون نشاط محدد"}
              </p>
              {unit.competency && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-500">{unit.competency}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">{unit.sessions_count ?? "—"} حصص مقترحة</p>
            </div>
          ))}
        </div>
      )}

      <UnitFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        teacherId={teacherId}
        schoolYears={schoolYears}
        levels={levels}
        activities={activities}
        initialValues={editingUnit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الوحدة التعلمية"
        message={`هل أنت متأكد من حذف "${deleteTarget?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
