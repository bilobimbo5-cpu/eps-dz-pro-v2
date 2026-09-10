"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Plus, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import {
  classifyPerformance,
  PERFORMANCE_LABELS,
  PERFORMANCE_STYLES,
} from "@/lib/evaluations/classification";
import EvaluationResultsChart from "@/components/evaluations/EvaluationResultsChart";
import { ListChecks } from "lucide-react";

type Criterion = {
  id: string;
  criterion: string;
  indicator: string | null;
  max_score: number;
  sort_order: number;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
};

export default function EvaluationDetailPage() {
  const params = useParams<{ id: string }>();
  const evaluationId = params.id;
  const router = useRouter();
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<{ title: string; class_id: string } | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});

  const [newCriterion, setNewCriterion] = useState({ criterion: "", indicator: "", max_score: 10 });
  const [addingCriterion, setAddingCriterion] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: evalRow } = await supabase
      .from("evaluations")
      .select("title, class_id")
      .eq("id", evaluationId)
      .eq("teacher_id", teacherId)
      .maybeSingle();

    if (!evalRow) {
      setLoading(false);
      return;
    }
    setEvaluation(evalRow);

    const [criteriaRes, studentsRes] = await Promise.all([
      supabase
        .from("evaluation_criteria")
        .select("id, criterion, indicator, max_score, sort_order")
        .eq("evaluation_id", evaluationId)
        .order("sort_order"),
      supabase
        .from("students")
        .select("id, first_name, last_name")
        .eq("class_id", evalRow.class_id)
        .eq("status", "active")
        .order("first_name"),
    ]);

    const criteriaList = criteriaRes.data ?? [];
    setCriteria(criteriaList);
    setStudents(studentsRes.data ?? []);

    if (criteriaList.length > 0) {
      const { data: resultsRes } = await supabase
        .from("evaluation_results")
        .select("student_id, criterion_id, score")
        .in(
          "criterion_id",
          criteriaList.map((c) => c.id)
        );

      const scoreMap: Record<string, Record<string, number>> = {};
      for (const row of resultsRes ?? []) {
        if (!scoreMap[row.student_id]) scoreMap[row.student_id] = {};
        scoreMap[row.student_id][row.criterion_id] = row.score;
      }
      setScores(scoreMap);
    }

    setLoading(false);
  }, [supabase, teacherId, evaluationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddCriterion(e: React.FormEvent) {
    e.preventDefault();
    if (!newCriterion.criterion.trim()) {
      toast.error("الرجاء إدخال نص المعيار");
      return;
    }
    setAddingCriterion(true);
    const { error } = await supabase.from("evaluation_criteria").insert({
      evaluation_id: evaluationId,
      criterion: newCriterion.criterion,
      indicator: newCriterion.indicator || null,
      max_score: newCriterion.max_score,
      sort_order: criteria.length,
    });
    setAddingCriterion(false);

    if (error) {
      toast.error("تعذّر إضافة المعيار");
      return;
    }
    setNewCriterion({ criterion: "", indicator: "", max_score: 10 });
    loadData();
  }

  async function handleDeleteCriterion(id: string) {
    const { error } = await supabase.from("evaluation_criteria").delete().eq("id", id);
    if (error) {
      toast.error("تعذّر حذف المعيار");
      return;
    }
    toast.success("تم حذف المعيار");
    loadData();
  }

  function setScore(studentId: string, criterionId: string, value: number, max: number) {
    const clamped = Math.max(0, Math.min(value, max));
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [criterionId]: clamped },
    }));
  }

  async function handleSaveResults() {
    if (criteria.length === 0 || students.length === 0) return;
    setSaving(true);

    const rows = students.flatMap((student) =>
      criteria
        .filter((c) => scores[student.id]?.[c.id] !== undefined)
        .map((c) => ({
          evaluation_id: evaluationId,
          criterion_id: c.id,
          student_id: student.id,
          score: scores[student.id][c.id],
        }))
    );

    if (rows.length === 0) {
      toast.error("لم تُدخل أي نتيجة بعد");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("evaluation_results")
      .upsert(rows, { onConflict: "criterion_id,student_id" });

    setSaving(false);

    if (error) {
      toast.error("تعذّر حفظ النتائج");
      return;
    }
    toast.success("تم حفظ النتائج بنجاح");
  }

  const maxTotal = criteria.reduce((sum, c) => sum + c.max_score, 0);

  const studentSummaries = students.map((student) => {
    const studentScores = scores[student.id] ?? {};
    const total = criteria.reduce((sum, c) => sum + (studentScores[c.id] ?? 0), 0);
    const percent = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
    return {
      student,
      total,
      percent,
      level: classifyPerformance(percent),
    };
  });

  const chartData = studentSummaries
    .filter((s) => criteria.some((c) => scores[s.student.id]?.[c.id] !== undefined))
    .map((s) => ({ name: `${s.student.first_name} ${s.student.last_name}`, percent: s.percent }));

  if (loading) return <Spinner />;

  if (!evaluation) {
    return (
      <EmptyState
        icon={ListChecks}
        title="التقويم غير موجود"
        description="ربما تم حذفه أو أنك لا تملك صلاحية الوصول إليه"
      />
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push("/evaluations")}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowRight size={16} />
        العودة إلى التقويم
      </button>

      <div>
        <h1 className="text-xl font-bold">{evaluation.title}</h1>
        <p className="text-sm text-gray-500">
          {maxTotal > 0
            ? `${criteria.length} معايير · المجموع الأقصى ${maxTotal} نقطة`
            : "أضف معايير التقييم أولًا"}
        </p>
      </div>

      {/* إدارة المعايير */}
      <div className="card">
        <h3 className="mb-3 text-base font-semibold">معايير ومؤشرات التقييم</h3>

        {criteria.length > 0 && (
          <ul className="mb-4 space-y-2">
            {criteria.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800"
              >
                <div>
                  <span className="font-medium">{c.criterion}</span>
                  {c.indicator && <span className="text-gray-400"> — {c.indicator}</span>}
                  <span className="mr-2 text-xs text-gray-400">({c.max_score} نقطة)</span>
                </div>
                <button
                  onClick={() => handleDeleteCriterion(c.id)}
                  className="rounded-lg p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddCriterion} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input
            className="input-field sm:col-span-2"
            placeholder="المعيار (مثال: التوازن)"
            value={newCriterion.criterion}
            onChange={(e) => setNewCriterion((p) => ({ ...p, criterion: e.target.value }))}
          />
          <input
            className="input-field"
            placeholder="المؤشر (اختياري)"
            value={newCriterion.indicator}
            onChange={(e) => setNewCriterion((p) => ({ ...p, indicator: e.target.value }))}
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              className="input-field"
              value={newCriterion.max_score}
              onChange={(e) =>
                setNewCriterion((p) => ({ ...p, max_score: Number(e.target.value) || 1 }))
              }
            />
            <button
              type="submit"
              disabled={addingCriterion}
              className="btn-primary w-auto shrink-0 px-3"
              aria-label="إضافة معيار"
            >
              <Plus size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* شبكة النتائج */}
      {criteria.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ListChecks}
            title="أضف معايير أولًا"
            description="بعد إضافة المعايير أعلاه، ستظهر شبكة تسجيل نتائج التلاميذ هنا"
          />
        </div>
      ) : students.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ListChecks}
            title="لا يوجد تلاميذ في هذا القسم"
            description="أضف تلاميذ إلى القسم المرتبط بهذا التقويم"
          />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">تسجيل النتائج</h3>
            <button onClick={handleSaveResults} disabled={saving} className="btn-primary w-auto px-4">
              <Save size={18} className="ml-1" />
              {saving ? "جارٍ الحفظ..." : "حفظ النتائج"}
            </button>
          </div>

          <table className="w-full text-right text-sm">
            <thead className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800">
              <tr>
                <th className="sticky right-0 bg-white px-3 py-2 font-medium dark:bg-gray-900">
                  التلميذ
                </th>
                {criteria.map((c) => (
                  <th key={c.id} className="min-w-[90px] px-3 py-2 text-center font-medium">
                    {c.criterion}
                    <div className="text-[10px] text-gray-400">/{c.max_score}</div>
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-medium">المجموع</th>
                <th className="px-3 py-2 text-center font-medium">نسبة الإتقان</th>
                <th className="px-3 py-2 text-center font-medium">المستوى</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {studentSummaries.map(({ student, total, percent, level }) => (
                <tr key={student.id}>
                  <td className="sticky right-0 bg-white px-3 py-2 font-medium dark:bg-gray-900">
                    {student.first_name} {student.last_name}
                  </td>
                  {criteria.map((c) => (
                    <td key={c.id} className="px-2 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={c.max_score}
                        className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm dark:border-gray-700 dark:bg-gray-800"
                        value={scores[student.id]?.[c.id] ?? ""}
                        onChange={(e) =>
                          setScore(student.id, c.id, Number(e.target.value) || 0, c.max_score)
                        }
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium">
                    {total}/{maxTotal}
                  </td>
                  <td className="px-3 py-2 text-center font-medium">{percent}%</td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${PERFORMANCE_STYLES[level]}`}
                    >
                      {PERFORMANCE_LABELS[level]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* رسم بياني لتوزيع الأداء */}
      {criteria.length > 0 && students.length > 0 && (
        <div className="card">
          <h3 className="mb-2 text-base font-semibold">توزيع نسب الإتقان بين التلاميذ</h3>
          <EvaluationResultsChart data={chartData} />
        </div>
      )}
    </div>
  );
}
