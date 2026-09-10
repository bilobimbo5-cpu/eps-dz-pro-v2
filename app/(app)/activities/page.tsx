"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Dumbbell, Plus, Pencil, Trash2, Search, Globe2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ActivityFormModal, { type ActivityFormValues } from "@/components/activities/ActivityFormModal";

type ActivityRow = {
  id: string;
  name: string;
  domain: string | null;
  duration_minutes: number | null;
  difficulty: "easy" | "medium" | "hard" | null;
  skills: string[] | null;
  equipment_needed: string[] | null;
  objective: string | null;
  pedagogical_notes: string | null;
  teacher_id: string | null;
  is_public: boolean;
  level_id: string | null;
  levels: { code: string } | null;
};

const DIFFICULTY_LABELS: Record<string, string> = { easy: "سهل", medium: "متوسط", hard: "صعب" };
const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  hard: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default function ActivitiesPage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [levels, setLevels] = useState<{ id: string; code: string }[]>([]);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"mine" | "public">("mine");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityFormValues | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ActivityRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [activitiesRes, levelsRes] = await Promise.all([
      supabase
        .from("activities")
        .select(
          "id, name, domain, duration_minutes, difficulty, skills, equipment_needed, objective, pedagogical_notes, teacher_id, is_public, level_id, levels(code)"
        )
        .or(`teacher_id.eq.${teacherId},is_public.eq.true`)
        .order("name"),
      supabase.from("levels").select("id, code").eq("is_active", true).order("sort_order"),
    ]);
    setActivities((activitiesRes.data ?? []) as unknown as ActivityRow[]);
    setLevels(levelsRes.data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    setEditingActivity(undefined);
    setModalOpen(true);
  }

  function openEdit(activity: ActivityRow) {
    setEditingActivity({
      id: activity.id,
      name: activity.name,
      domain: activity.domain ?? "",
      level_id: activity.level_id ?? "",
      objective: activity.objective ?? "",
      skills: (activity.skills ?? []).join(", "),
      equipment_needed: (activity.equipment_needed ?? []).join(", "),
      duration_minutes: activity.duration_minutes ?? 30,
      difficulty: activity.difficulty ?? "medium",
      pedagogical_notes: activity.pedagogical_notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("activities").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("تعذّر حذف النشاط");
      return;
    }
    toast.success("تم حذف النشاط");
    setDeleteTarget(null);
    loadData();
  }

  const filtered = activities.filter((a) => {
    const matchesScope = scope === "mine" ? a.teacher_id === teacherId : a.is_public;
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    return matchesScope && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">مكتبة الأنشطة الرياضية</h1>
          <p className="text-sm text-gray-500">أنشطتك الخاصة + المحتوى المعتمد من الإدارة</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5">
          <Plus size={18} className="ml-1" />
          إضافة نشاط
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setScope("mine")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              scope === "mine" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            أنشطتي
          </button>
          <button
            onClick={() => setScope("public")}
            className={`inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
              scope === "public" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            <Globe2 size={14} />
            المحتوى المعتمد
          </button>
        </div>
        <div className="relative max-w-sm">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pr-9"
            placeholder="ابحث عن نشاط..."
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
            icon={Dumbbell}
            title={scope === "mine" ? "لا توجد أنشطة خاصة بك بعد" : "لا يوجد محتوى معتمد بعد"}
            description={
              scope === "mine" ? "أضف أول نشاط لاستعماله في الحصص والوحدات" : "سيظهر هنا المحتوى الذي تضيفه الإدارة"
            }
            actionLabel={scope === "mine" ? "إضافة نشاط" : undefined}
            onAction={scope === "mine" ? openCreate : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((activity) => (
            <div key={activity.id} className="card">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex gap-1.5">
                  {activity.levels?.code && (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {activity.levels.code}
                    </span>
                  )}
                  {activity.difficulty && (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${DIFFICULTY_STYLES[activity.difficulty]}`}>
                      {DIFFICULTY_LABELS[activity.difficulty]}
                    </span>
                  )}
                </div>
                {scope === "mine" && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(activity)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(activity)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold">{activity.name}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {activity.domain} {activity.duration_minutes && `· ${activity.duration_minutes} د`}
              </p>
              {activity.objective && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-500">{activity.objective}</p>
              )}
              {activity.skills && activity.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {activity.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ActivityFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        teacherId={teacherId}
        levels={levels}
        initialValues={editingActivity}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف النشاط"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
