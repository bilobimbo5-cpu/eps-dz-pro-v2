"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ListChecks, Plus, Trash2, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EvaluationFormModal from "@/components/evaluations/EvaluationFormModal";

type EvaluationRow = {
  id: string;
  title: string;
  eval_type: "diagnostic" | "formative" | "summative";
  term: number | null;
  eval_date: string | null;
  class_id: string;
  classes: { name: string } | null;
  activities: { name: string } | null;
};

const TYPE_LABELS: Record<EvaluationRow["eval_type"], string> = {
  diagnostic: "تشخيصي",
  formative: "تكويني",
  summative: "ختامي",
};

const TYPE_STYLES: Record<EvaluationRow["eval_type"], string> = {
  diagnostic: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  formative: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  summative: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

export default function EvaluationsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [activities, setActivities] = useState<{ id: string; name: string }[]>([]);
  const [classFilter, setClassFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EvaluationRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [evalRes, classesRes, activitiesRes] = await Promise.all([
      supabase
        .from("evaluations")
        .select("id, title, eval_type, term, eval_date, class_id, classes(name), activities(name)")
        .eq("teacher_id", teacherId)
        .order("eval_date", { ascending: false }),
      supabase.from("classes").select("id, name").eq("teacher_id", teacherId),
      supabase.from("activities").select("id, name").or(`teacher_id.eq.${teacherId},is_public.eq.true`),
    ]);
    setEvaluations((evalRes.data ?? []) as unknown as EvaluationRow[]);
    setClasses(classesRes.data ?? []);
    setActivities(activitiesRes.data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    if (classes.length === 0) {
      toast.error("أضف قسمًا أولًا قبل إنشاء تقويم");
      return;
    }
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("evaluations").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("تعذّر حذف التقويم");
      return;
    }
    toast.success("تم حذف التقويم");
    setDeleteTarget(null);
    loadData();
  }

  const filtered = evaluations.filter((e) => !classFilter || e.class_id === classFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">التقويم</h1>
          <p className="text-sm text-gray-500">شبكات التقييم ونتائج التلاميذ</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5">
          <Plus size={18} className="ml-1" />
          إنشاء تقويم
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
            icon={ListChecks}
            title="لا توجد تقييمات بعد"
            description="أنشئ أول تقويم لبناء شبكة معايير وتسجيل نتائج التلاميذ"
            actionLabel="إنشاء تقويم"
            onAction={openCreate}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ev) => (
            <Link
              key={ev.id}
              href={`/evaluations/${ev.id}`}
              className="card block transition hover:border-primary-300"
            >
              <div className="mb-2 flex items-start justify-between">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_STYLES[ev.eval_type]}`}>
                  {TYPE_LABELS[ev.eval_type]}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteTarget(ev);
                  }}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <h3 className="font-semibold">{ev.title}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {ev.classes?.name} · {ev.activities?.name || "بدون نشاط"}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>{ev.eval_date ? new Date(ev.eval_date).toLocaleDateString("ar-DZ") : "بدون تاريخ"}</span>
                <span className="inline-flex items-center gap-1 text-primary-600">
                  فتح الشبكة <ChevronLeft size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <EvaluationFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(evaluationId) => {
          loadData();
          router.push(`/evaluations/${evaluationId}`);
        }}
        teacherId={teacherId}
        classes={classes}
        activities={activities}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف التقويم"
        message={`هل أنت متأكد من حذف "${deleteTarget?.title}"؟ سيتم حذف شبكة المعايير وكل النتائج المسجّلة. لا يمكن التراجع عن هذا الإجراء.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
