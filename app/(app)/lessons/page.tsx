"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CalendarPlus, Plus, Pencil, Trash2, Copy, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type LessonRow = {
  id: string;
  objective: string;
  session_date: string | null;
  duration_minutes: number | null;
  status: "draft" | "ready" | "done";
  class_id: string;
  classes: { name: string } | null;
  activities: { name: string } | null;
};

const STATUS_LABELS: Record<LessonRow["status"], string> = {
  draft: "مسودة",
  ready: "جاهزة",
  done: "مُنجزة",
};

const STATUS_STYLES: Record<LessonRow["status"], string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  ready: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  done: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

export default function LessonsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LessonRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [lessonsRes, classesRes] = await Promise.all([
      supabase
        .from("lessons")
        .select("id, objective, session_date, duration_minutes, status, class_id, classes(name), activities(name)")
        .eq("teacher_id", teacherId)
        .order("session_date", { ascending: false }),
      supabase.from("classes").select("id, name").eq("teacher_id", teacherId),
    ]);
    setLessons((lessonsRes.data ?? []) as unknown as LessonRow[]);
    setClasses(classesRes.data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("lessons").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("تعذّر حذف الحصة");
      return;
    }
    toast.success("تم حذف الحصة");
    setDeleteTarget(null);
    loadData();
  }

  async function handleDuplicate(lesson: LessonRow) {
    const { data: full } = await supabase.from("lessons").select("*").eq("id", lesson.id).single();
    if (!full) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...rest } = full;
    const { error } = await supabase.from("lessons").insert({ ...rest, status: "draft" });

    if (error) {
      toast.error("تعذّر نسخ الحصة");
      return;
    }
    toast.success("تم إنشاء نسخة من الحصة");
    loadData();
  }

  const filtered = lessons.filter((l) => !classFilter || l.class_id === classFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">الحصص</h1>
          <p className="text-sm text-gray-500">كل الحصص التي بنيتها عبر Session Builder</p>
        </div>
        <button onClick={() => router.push("/lesson-builder")} className="btn-primary w-auto px-5">
          <Plus size={18} className="ml-1" />
          إنشاء حصة
        </button>
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

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarPlus}
            title="لا توجد حصص بعد"
            description="أنشئ أول حصة عبر Session Builder بمكوناته السبعة"
            actionLabel="إنشاء حصة"
            onAction={() => router.push("/lesson-builder")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lesson) => (
            <div key={lesson.id} className="card">
              <div className="mb-2 flex items-start justify-between">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[lesson.status]}`}>
                  {STATUS_LABELS[lesson.status]}
                </span>
                <div className="flex gap-1">
                  <Link
                    href={`/lesson-builder?id=${lesson.id}`}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Pencil size={15} />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(lesson)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(lesson)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <h3 className="line-clamp-2 font-semibold">{lesson.objective}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Dumbbell size={12} />
                {lesson.activities?.name || "بدون نشاط"} · {lesson.classes?.name}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {lesson.session_date
                  ? new Date(lesson.session_date).toLocaleDateString("ar-DZ")
                  : "بدون تاريخ"}
                {lesson.duration_minutes && ` · ${lesson.duration_minutes} د`}
              </p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الحصة"
        message="هل أنت متأكد من حذف هذه الحصة؟ لا يمكن التراجع عن هذا الإجراء."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
