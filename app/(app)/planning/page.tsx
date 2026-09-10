"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { CalendarRange, Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PlanFormModal, { type PlanFormValues } from "@/components/planning/PlanFormModal";

type PlanRow = {
  id: string;
  plan_type: "annual" | "term" | "monthly" | "weekly";
  term: number | null;
  month: number | null;
  content: { title?: string; notes?: string } | null;
  school_year_id: string;
  level_id: string | null;
  class_id: string | null;
  levels: { code: string } | null;
  classes: { name: string } | null;
};

const TYPE_TABS: { key: PlanRow["plan_type"] | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "annual", label: "سنوي" },
  { key: "term", label: "فصلي" },
  { key: "monthly", label: "شهري" },
  { key: "weekly", label: "أسبوعي" },
];

export default function PlanningPage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [schoolYears, setSchoolYears] = useState<{ id: string; label: string }[]>([]);
  const [levels, setLevels] = useState<{ id: string; code: string; label_ar: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<PlanRow["plan_type"] | "all">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanFormValues | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<PlanRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [plansRes, yearsRes, levelsRes, classesRes] = await Promise.all([
      supabase
        .from("lesson_plans")
        .select("id, plan_type, term, month, content, school_year_id, level_id, class_id, levels(code), classes(name)")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false }),
      supabase.from("school_years").select("id, label").eq("teacher_id", teacherId),
      supabase.from("levels").select("id, code, label_ar").eq("is_active", true).order("sort_order"),
      supabase.from("classes").select("id, name").eq("teacher_id", teacherId),
    ]);
    setPlans((plansRes.data ?? []) as unknown as PlanRow[]);
    setSchoolYears(yearsRes.data ?? []);
    setLevels(levelsRes.data ?? []);
    setClasses(classesRes.data ?? []);
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
    setEditingPlan(undefined);
    setModalOpen(true);
  }

  function openEdit(plan: PlanRow) {
    setEditingPlan({
      id: plan.id,
      plan_type: plan.plan_type,
      school_year_id: plan.school_year_id,
      level_id: plan.level_id ?? "",
      class_id: plan.class_id ?? "",
      term: plan.term ?? "",
      month: plan.month ?? "",
      title: plan.content?.title ?? "",
      notes: plan.content?.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("lesson_plans").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("تعذّر حذف الخطة");
      return;
    }
    toast.success("تم حذف الخطة");
    setDeleteTarget(null);
    loadData();
  }

  const filtered = plans.filter((p) => activeTab === "all" || p.plan_type === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">التخطيط</h1>
          <p className="text-sm text-gray-500">التخطيط السنوي، الفصلي، الشهري والأسبوعي</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5">
          <Plus size={18} className="ml-1" />
          إضافة خطة
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarRange}
            title="لا توجد خطط بعد"
            description="أضف أول خطة لتنظيم برنامجك الدراسي"
            actionLabel="إضافة خطة"
            onAction={openCreate}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((plan) => (
            <div key={plan.id} className="card">
              <div className="mb-2 flex items-start justify-between">
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {TYPE_TABS.find((t) => t.key === plan.plan_type)?.label}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(plan)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(plan)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold">{plan.content?.title || "بدون عنوان"}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {plan.levels?.code ?? "كل المستويات"} · {plan.classes?.name ?? "كل الأقسام"}
              </p>
              {plan.content?.notes && (
                <p className="mt-2 line-clamp-3 text-xs text-gray-500">{plan.content.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <PlanFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        teacherId={teacherId}
        schoolYears={schoolYears}
        levels={levels}
        classes={classes}
        initialValues={editingPlan}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الخطة"
        message="هل أنت متأكد من حذف هذه الخطة؟ لا يمكن التراجع عن هذا الإجراء."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
