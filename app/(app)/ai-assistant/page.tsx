"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Sparkles, RefreshCw, Pencil, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";

type GeneratedLesson = {
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
};

const FIELD_LABELS: Record<keyof GeneratedLesson, string> = {
  objective: "الهدف التعلمي",
  competency: "الكفاءة",
  starting_situation: "وضعية الانطلاق",
  warm_up: "الإحماء",
  teaching_situation_1: "الوضعية التعليمية الأولى",
  teaching_situation_2: "الوضعية التعليمية الثانية",
  integration_situation: "الوضعية الإدماجية",
  evaluation: "التقويم",
  cool_down: "العودة إلى الهدوء",
  organization: "التنظيم",
  success_criteria: "معايير النجاح",
};

const EXAMPLE_PROMPTS = [
  "أنشئ لي حصة للسنة الرابعة حول الجري لمدة 45 دقيقة وعدد التلاميذ 25",
  "حصة للسنة الثانية حول التوازن والتنسيق الحركي، 40 دقيقة",
  "حصة كرة اليد للسنة الخامسة، إحماء مكثف، 45 دقيقة",
];

export default function AiAssistantPage() {
  const router = useRouter();
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedLesson | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error("اكتب وصف الحصة أولًا");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "تعذّر التوليد");
        setResult(null);
      } else {
        setResult(data.lesson);

        // نسجّل عملية التوليد في سجل ai_generations (بدون بيانات تلاميذ حقيقية)
        await supabase.from("ai_generations").insert({
          teacher_id: teacherId,
          prompt,
          target_type: "lesson",
          raw_response: data.lesson,
        });
      }
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  async function handleEditInBuilder() {
    if (!result) return;
    setSaving(true);

    const { data: classes } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", teacherId)
      .limit(1);

    const { data: newLesson, error: insertError } = await supabase
      .from("lessons")
      .insert({
        teacher_id: teacherId,
        class_id: classes?.[0]?.id ?? null,
        ...result,
        status: "draft",
        generated_by_ai: true,
      })
      .select("id")
      .single();

    setSaving(false);

    if (insertError || !newLesson) {
      toast.error("تعذّر حفظ المسودة");
      return;
    }

    toast.success("تم حفظ المسودة — يمكنك الآن تعديلها");
    router.push(`/lesson-builder?id=${newLesson.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="text-primary-600" size={22} />
          المساعد الذكي
        </h1>
        <p className="text-sm text-gray-500">
          صف الحصة التي تريدها بلغة طبيعية، وسيقترح المساعد مسودة كاملة قابلة للتعديل
        </p>
      </div>

      <div className="card space-y-3">
        <textarea
          className="input-field min-h-[100px]"
          placeholder="مثال: أنشئ لي حصة للسنة الرابعة حول الجري لمدة 45 دقيقة وعدد التلاميذ 25"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              onClick={() => setPrompt(example)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-primary-300 hover:text-primary-700 dark:border-gray-800"
            >
              {example}
            </button>
          ))}
        </div>

        <button onClick={handleGenerate} disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <RefreshCw size={18} className="ml-1 animate-spin" />
              جارٍ التوليد...
            </>
          ) : (
            <>
              <Sparkles size={18} className="ml-1" />
              توليد المسودة
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="card flex items-start gap-3 border-red-200 bg-red-50 dark:bg-red-950">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="card">
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Sparkles size={14} />
            محتوى مولّد آليًا — راجعه وعدّله قبل استخدامه في الحصة الفعلية
          </div>

          <div className="space-y-3 text-sm">
            {(Object.keys(FIELD_LABELS) as (keyof GeneratedLesson)[]).map((key) => (
              <div key={key}>
                <p className="text-xs font-semibold text-gray-400">{FIELD_LABELS[key]}</p>
                <p className="text-gray-700 dark:text-gray-300">{result[key]}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={handleGenerate} disabled={loading} className="btn-secondary">
              <RefreshCw size={16} className="ml-1" />
              إعادة التوليد
            </button>
            <button onClick={handleEditInBuilder} disabled={saving} className="btn-primary">
              <Pencil size={16} className="ml-1" />
              {saving ? "جارٍ الحفظ..." : "فتح في Session Builder للتعديل والحفظ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
