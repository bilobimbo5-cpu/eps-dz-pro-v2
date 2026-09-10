"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { ONBOARDING_STEPS, type OnboardingData } from "@/types/onboarding";

import StepName from "./steps/StepName";
import StepWilaya from "./steps/StepWilaya";
import StepDirectorate from "./steps/StepDirectorate";
import StepSchool from "./steps/StepSchool";
import StepPhase from "./steps/StepPhase";
import StepSchoolYear from "./steps/StepSchoolYear";
import StepLevels from "./steps/StepLevels";
import StepFirstClass from "./steps/StepFirstClass";

const STEP_LABELS = [
  "الاسم",
  "الولاية",
  "المديرية",
  "المؤسسة",
  "الطور",
  "الموسم",
  "المستويات",
  "أول قسم",
];

function getDefaultSchoolYear() {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    label: `${startYear}/${startYear + 1}`,
    start: `${startYear}-09-01`,
    end: `${startYear + 1}-06-30`,
  };
}

export default function OnboardingWizard({
  userId,
  defaultFullName,
}: {
  userId: string;
  defaultFullName: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const defaultYear = getDefaultSchoolYear();

  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: defaultFullName,
    wilaya: "",
    educationDirectorate: "",
    phase: "ابتدائي",
    schoolName: "",
    schoolCommune: "",
    schoolYearLabel: defaultYear.label,
    schoolYearStart: defaultYear.start,
    schoolYearEnd: defaultYear.end,
    levelIds: [],
    firstClassName: "",
    firstClassLevelId: "",
  });

  const currentStep = ONBOARDING_STEPS[stepIndex];
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  function patch(p: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...p }));
  }

  function validateCurrentStep(): string | null {
    switch (currentStep) {
      case "name":
        return data.fullName.trim() ? null : "الرجاء إدخال الاسم واللقب";
      case "wilaya":
        return data.wilaya ? null : "الرجاء اختيار الولاية";
      case "directorate":
        return data.educationDirectorate.trim()
          ? null
          : "الرجاء إدخال مديرية التربية";
      case "school":
        return data.schoolName.trim() ? null : "الرجاء إدخال اسم المؤسسة";
      case "phase":
        return data.phase ? null : "الرجاء اختيار الطور";
      case "schoolYear":
        return data.schoolYearLabel && data.schoolYearStart && data.schoolYearEnd
          ? null
          : "الرجاء إكمال بيانات الموسم الدراسي";
      case "levels":
        return data.levelIds.length > 0 ? null : "اختر مستوى واحدًا على الأقل";
      case "firstClass":
        return data.firstClassName.trim() && data.firstClassLevelId
          ? null
          : "الرجاء إكمال بيانات القسم";
      default:
        return null;
    }
  }

  function handleNext() {
    const error = validateCurrentStep();
    if (error) {
      toast.error(error);
      return;
    }
    if (isLastStep) {
      void handleFinish();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  function handleBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  async function handleFinish() {
    setSubmitting(true);
    try {
      // 1) تحديث بيانات الأستاذ
      const { error: userError } = await supabase
        .from("users")
        .update({ full_name: data.fullName })
        .eq("id", userId);
      if (userError) throw userError;

      // 2) تحديث/إنشاء ملف teacher_profiles
      // ملاحظة: نحدّد onConflict على user_id صراحة (وليس المفتاح الأساسي id)
      // لأن صف teacher_profiles يُنشأ تلقائيًا الآن منذ التسجيل عبر Postgres
      // trigger — بدون هذا التحديد، upsert يحاول المطابقة على id فيفشل بتعارض
      // فريد (unique violation) على user_id لأن الصف موجود مسبقًا.
      const { error: profileError } = await supabase
        .from("teacher_profiles")
        .upsert(
          {
            user_id: userId,
            wilaya: data.wilaya,
            education_directorate: data.educationDirectorate,
            phase: data.phase,
            onboarding_completed: true,
            onboarding_step: ONBOARDING_STEPS.length,
          },
          { onConflict: "user_id" }
        );
      if (profileError) throw profileError;

      // 3) إنشاء الموسم الدراسي
      const { data: yearRow, error: yearError } = await supabase
        .from("school_years")
        .insert({
          teacher_id: userId,
          label: data.schoolYearLabel,
          start_date: data.schoolYearStart,
          end_date: data.schoolYearEnd,
          is_active: true,
        })
        .select()
        .single();
      if (yearError) throw yearError;

      // 4) إنشاء المؤسسة
      const { data: schoolRow, error: schoolError } = await supabase
        .from("schools")
        .insert({
          teacher_id: userId,
          name: data.schoolName,
          commune: data.schoolCommune,
          wilaya: data.wilaya,
          school_year_id: yearRow.id,
        })
        .select()
        .single();
      if (schoolError) throw schoolError;

      // 5) إنشاء أول قسم
      const { error: classError } = await supabase.from("classes").insert({
        teacher_id: userId,
        school_id: schoolRow.id,
        level_id: data.firstClassLevelId,
        name: data.firstClassName,
      });
      if (classError) throw classError;

      toast.success("تم إعداد مساحة عملك بنجاح 🎉");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء الحفظ، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  const progressPercent = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* شريط التقدم */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            الخطوة {stepIndex + 1} من {ONBOARDING_STEPS.length}
          </span>
          <span>{STEP_LABELS[stepIndex]}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="card">
        {currentStep === "name" && <StepName data={data} onChange={patch} />}
        {currentStep === "wilaya" && <StepWilaya data={data} onChange={patch} />}
        {currentStep === "directorate" && (
          <StepDirectorate data={data} onChange={patch} />
        )}
        {currentStep === "school" && <StepSchool data={data} onChange={patch} />}
        {currentStep === "phase" && <StepPhase data={data} onChange={patch} />}
        {currentStep === "schoolYear" && (
          <StepSchoolYear data={data} onChange={patch} />
        )}
        {currentStep === "levels" && <StepLevels data={data} onChange={patch} />}
        {currentStep === "firstClass" && (
          <StepFirstClass data={data} onChange={patch} />
        )}

        <div className="mt-6 flex gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="btn-secondary"
            >
              السابق
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting
              ? "جارٍ الحفظ..."
              : isLastStep
              ? "إنهاء وبدء الاستخدام"
              : "التالي"}
          </button>
        </div>
      </div>
    </div>
  );
}
