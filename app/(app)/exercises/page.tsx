"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { ListChecks, Plus, Pencil, Trash2, Search, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ExerciseFormModal, { type ExerciseFormValues } from "@/components/exercises/ExerciseFormModal";

type ExerciseRow = {
  id: string;
  name: string;
  objective: string | null;
  student_count: number | null;
  duration_minutes: number | null;
  equipment_needed: string[] | null;
  organization: string | null;
  instructions: string | null;
  success_criteria: string | null;
  is_favorite: boolean;
  activity_id: string | null;
  level_id: string | null;
  activities: { name: string } | null;
  levels: { code: string } | null;
};

export default function ExercisesPage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [levels, setLevels] = useState<{ id: string; code: string }[]>([]);
  const [activities, setActivities] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseFormValues | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ExerciseRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [exercisesRes, levelsRes, activitiesRes] = await Promise.all([
      supabase
        .from("exercises")
        .select(
          "id, name, objective, student_count, duration_minutes, equipment_needed, organization, instructions, success_criteria, is_favorite, activity_id, level_id, activities(name), levels(code)"
        )
        .or(`teacher_id.eq.${teacherId},is_public.eq.true`)
        .order("name"),
      supabase.from("levels").select("id, code").eq("is_active", true).order("sort_order"),
      supabase.from("activities").select("id, name").or(`teacher_id.eq.${teacherId},is_public.eq.true`),
    ]);
    setExercises((exercisesRes.data ?? []) as unknown as ExerciseRow[]);
    setLevels(levelsRes.data ?? []);
    setActivities(activitiesRes.data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    setEditingExercise(undefined);
    setModalOpen(true);
  }

  function openEdit(exercise: ExerciseRow) {
    setEditingExercise({
      id: exercise.id,
      name: exercise.name,
      activity_id: exercise.activity_id ?? "",
      level_id: exercise.level_id ?? "",
      objective: exercise.objective ?? "",
      student_count: exercise.student_count ?? 20,
      equipment_needed: (exercise.equipment_needed ?? []).join(", "),
      duration_minutes: exercise.duration_minutes ?? 10,
      organization: exercise.organization ?? "",
      instructions: exercise.instructions ?? "",
      success_criteria: exercise.success_criteria ?? "",
    });
    setModalOpen(true);
  }

  async function toggleFavorite(exercise: ExerciseRow) {
    await supabase.from("exercises").update({ is_favorite: !exercise.is_favorite }).eq("id", exercise.id);
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("exercises").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("تعذّر حذف التمرين");
      return;
    }
    toast.success("تم حذف التمرين");
    setDeleteTarget(null);
    loadData();
  }

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesFavorite = !favoritesOnly || ex.is_favorite;
    return matchesSearch && matchesFavorite;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">مكتبة التمارين</h1>
          <p className="text-sm text-gray-500">تمارين جاهزة للاستعمال داخل الحصص</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5">
          <Plus size={18} className="ml-1" />
          إضافة تمرين
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => setFavoritesOnly((f) => !f)}
          className={`inline-flex w-fit items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
            favoritesOnly ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          <Star size={14} fill={favoritesOnly ? "currentColor" : "none"} />
          المفضلة فقط
        </button>
        <div className="relative max-w-sm">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pr-9"
            placeholder="ابحث عن تمرين..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ListChecks}
            title="لا توجد تمارين بعد"
            description="أضف أول تمرين لاستعماله عند بناء الحصص"
            actionLabel="إضافة تمرين"
            onAction={openCreate}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exercise) => (
            <div key={exercise.id} className="card">
              <div className="mb-2 flex items-start justify-between">
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {exercise.levels?.code || "كل المستويات"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleFavorite(exercise)}
                    className={`rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      exercise.is_favorite ? "text-amber-500" : "text-gray-400"
                    }`}
                  >
                    <Star size={14} fill={exercise.is_favorite ? "currentColor" : "none"} />
                  </button>
                  <button onClick={() => openEdit(exercise)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(exercise)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold">{exercise.name}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {exercise.activities?.name || "بدون نشاط"} · {exercise.student_count} تلميذ ·{" "}
                {exercise.duration_minutes} د
              </p>
              {exercise.objective && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-500">{exercise.objective}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <ExerciseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        teacherId={teacherId}
        levels={levels}
        activities={activities}
        initialValues={editingExercise}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف التمرين"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
