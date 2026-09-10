"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Save, ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";

type LessonForm = {
  class_id: string;
  learning_unit_id: string;
  activity_id: string;
  session_date: string;
  duration_minutes: number;
  objective: string;
  competency: string;
  starting_situation: string;
  warm_up: string;
  teaching_situation_1: string;
  teaching_situation_2: string;
  integration_situation: string;
  evaluation: string;
  cool_down: string;
  organization: string;
  success_criteria: string;
  notes: string;
  status: "draft" | "ready" | "done";
};

const EMPTY_FORM: LessonForm = {
  class_id: "",
  learning_unit_id: "",
  activity_id: "",
  session_date: new Date().toISOString().slice(0, 10),
  duration_minutes: 45,
  objective: "",
  competency: "",
  starting_situation: "",
  warm_up: "",
  teaching_situation_1: "",
  teaching_situation_2: "",
  integration_situation: "",
  evaluation: "",
  cool_down: "",
  organization: "",
  success_criteria: "",
  notes: "",
  status: "draft",
};

const SECTIONS: { key: keyof LessonForm; title: string; placeholder: string }[] = [
  {
    key: "starting_situation",
    title: "1. وضعية الانطلاق",
    placeholder: "كيف ستقدّم الحصة وتثير اهتمام التلاميذ؟",
  },
  {
    key: "warm_up",
    title: "2. الإحماء",
    placeholder: "تمارين تحضير الجسم للمجهود (5-8 دقائق)",
  },
  {
    key: "teaching_situation_1",
    title: "3. الوضعية التعليمية الأولى",
    placeholder: "الوصف، التنظيم، الأدوات...",
  },
  {
    key: "teaching_situation_2",
    title: "4. الوضعية التعليمية الثانية",
    placeholder: "تطوير أو تعقيد للوضعية الأولى...",
  },
  {
    key: "integration_situation",
    title: "5. الوضعية الإدماجية",
    placeholder: "وضعية تُدمج فيها المهارات المكتسبة (لعبة، تحدي...)",
  },
  {
    key: "evaluation",
    title: "6. التقويم",
    placeholder: "كيف ستُقيّم بلوغ الهدف؟",
  },
  {
    key: "cool_down",
    title: "7. العودة إلى الهدوء",
    placeholder: "تمارين استرخاء وتهدئة قبل نهاية الحصة",
  },
];

function LessonBuilderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("id");

  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [form, setForm] = useState<LessonForm>(EMPTY_FORM);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; title: string }[]>([]);
  const [activities, setActivities] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<LessonForm>) {
    setForm((prev) => ({ ...prev, ...p }));
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    const [classesRes, unitsRes, activitiesRes] = await Promise.all([
      supabase.from("classes").select("id, name").eq("teacher_id", teacherId).order("name"),
      supabase.from("learning_units").select("id, title").eq("teacher_id", teacherId),
      supabase.from("activities").select("id, name").or(`teacher_id.eq.${teacherId},is_public.eq.true`),
    ]);
    setClasses(classesRes.data ?? []);
    setUnits(unitsRes.data ?? []);
    setActivities(activitiesRes.data ?? []);

    if (lessonId) {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .eq("teacher_id", teacherId)
        .maybeSingle();

      if (lesson) {
        setForm({
          class_id: lesson.class_id ?? "",
          learning_unit_id: lesson.learning_unit_id ?? "",
          activity_id: lesson.activity_id ?? "",
          session_date: lesson.session_date ?? EMPTY_FORM.session_date,
          duration_minutes: lesson.duration_minutes ?? 45,
          objective: lesson.objective ?? "",
          competency: lesson.competency ?? "",
          starting_situation: lesson.starting_situation ?? "",
          warm_up: lesson.warm_up ?? "",
          teaching_situation_1: lesson.teaching_situation_1 ?? "",
          teaching_situation_2: lesson.teaching_situation_2 ?? "",
          integration_situation: lesson.integration_situation ?? "",
          evaluation: lesson.evaluation ?? "",
          cool_down: lesson.cool_down ?? "",
          organization: lesson.organization ?? "",
          success_criteria: lesson.success_criteria ?? "",
          notes: lesson.notes ?? "",
          status: lesson.status ?? "draft",
        });
      }
    } else {
      setForm((prev) => ({
        ...prev,
        class_id: classesRes.data?.[0]?.id ?? "",
      }));
    }

    setLoading(false);
  }, [supabase, teacherId, lessonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave(status: LessonForm["status"]) {
    if (!form.class_id) {
      toast.error("الرجاء اختيار القسم");
      return;
    }
    if (!form.objective.trim()) {
      toast.error("الرجاء إدخال هدف الحصة");
      return;
    }

    setSaving(true);
    const payload = {
      teacher_id: teacherId,
      class_id: form.class_id,
      learning_unit_id: form.learning_unit_id || null,
      activity_id: form.activity_id || null,
      session_date: form.session_date || null,
      duration_minutes: form.duration_minutes || null,
      objective: form.objective,
      competency: form.competency || null,
      starting_situation: form.starting_situation || null,
      warm_up: form.warm_up || null,
      teaching_situation_1: form.teaching_situation_1 || null,
      teaching_situation_2: form.teaching_situation_2 || null,
      integration_situation: form.integration_situation || null,
      evaluation: form.evaluation || null,
      cool_down: form.cool_down || null,
      organization: form.organization || null,
      success_criteria: form.success_criteria || null,
      notes: form.notes || null,
      status,
    };

    const { error } = lessonId
      ? await supabase.from("lessons").update(payload).eq("id", lessonId)
      : await supabase.from("lessons").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("حدث خطأ أثناء حفظ الحصة");
      return;
    }

    toast.success(lessonId ? "تم تحديث الحصة" : "تم حفظ الحصة");
    router.push("/lessons");
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/lessons")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowRight size={16} />
          العودة إلى الحصص
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold">{lessonId ? "تعديل الحصة" : "إنشاء حصة جديدة"}</h1>
        <p className="text-sm text-gray-500">اِبنِ حصتك خطوة بخطوة عبر المكونات السبعة</p>
      </div>

      {/* بيانات الحصة الأساسية */}
      <div className="card space-y-4">
        <h3 className="text-base font-semibold">بيانات الحصة</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              القسم *
            </label>
            <select
              className="input-field"
              value={form.class_id}
              onChange={(e) => patch({ class_id: e.target.value })}
            >
              <option value="">اختر القسم...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              التاريخ
            </label>
            <input
              type="date"
              className="input-field"
              value={form.session_date}
              onChange={(e) => patch({ session_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              الوحدة التعلمية
            </label>
            <select
              className="input-field"
              value={form.learning_unit_id}
              onChange={(e) => patch({ learning_unit_id: e.target.value })}
            >
              <option value="">بدون تحديد</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              النشاط
            </label>
            <select
              className="input-field"
              value={form.activity_id}
              onChange={(e) => patch({ activity_id: e.target.value })}
            >
              <option value="">بدون تحديد</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            المدة (بالدقائق)
          </label>
          <input
            type="number"
            min={10}
            className="input-field max-w-[140px]"
            value={form.duration_minutes}
            onChange={(e) => patch({ duration_minutes: Number(e.target.value) })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            الهدف التعلمي *
          </label>
          <textarea
            className="input-field min-h-[60px]"
            value={form.objective}
            onChange={(e) => patch({ objective: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            الكفاءة
          </label>
          <textarea
            className="input-field min-h-[60px]"
            value={form.competency}
            onChange={(e) => patch({ competency: e.target.value })}
          />
        </div>
      </div>

      {/* المكونات السبعة */}
      {SECTIONS.map((section) => (
        <div key={section.key} className="card">
          <h3 className="mb-2 text-base font-semibold">{section.title}</h3>
          <textarea
            className="input-field min-h-[100px]"
            placeholder={section.placeholder}
            value={form[section.key] as string}
            onChange={(e) => patch({ [section.key]: e.target.value } as Partial<LessonForm>)}
          />
        </div>
      ))}

      {/* التنظيم ومعايير النجاح */}
      <div className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            التنظيم
          </label>
          <textarea
            className="input-field min-h-[70px]"
            placeholder="تنظيم الأفواج، توزيع المساحة، الأدوار..."
            value={form.organization}
            onChange={(e) => patch({ organization: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            معايير النجاح
          </label>
          <textarea
            className="input-field min-h-[70px]"
            value={form.success_criteria}
            onChange={(e) => patch({ success_criteria: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            ملاحظات
          </label>
          <textarea
            className="input-field min-h-[70px]"
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </div>
      </div>

      {/* إشارة للمساعد الذكي (سيُبنى في مرحلة لاحقة) */}
      <div className="card flex items-center gap-3 border-dashed">
        <Sparkles size={20} className="text-primary-600" />
        <p className="text-sm text-gray-500">
          يمكنك مستقبلًا توليد مسودة هذه الحصة تلقائيًا عبر المساعد الذكي (قسم 18 في خطة البناء).
        </p>
      </div>

      <div className="sticky bottom-4 flex gap-3 rounded-2xl bg-white p-3 shadow-lg dark:bg-gray-900">
        <button
          onClick={() => handleSave("draft")}
          disabled={saving}
          className="btn-secondary"
        >
          حفظ كمسودة
        </button>
        <button onClick={() => handleSave("ready")} disabled={saving} className="btn-primary">
          <Save size={18} className="ml-1" />
          {saving ? "جارٍ الحفظ..." : "حفظ الحصة"}
        </button>
      </div>
    </div>
  );
}

export default function LessonBuilderPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LessonBuilderForm />
    </Suspense>
  );
}
