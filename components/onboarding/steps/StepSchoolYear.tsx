import type { OnboardingData } from "@/types/onboarding";

export default function StepSchoolYear({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">الموسم الدراسي</h3>
      <p className="text-sm text-gray-500">حدد الموسم الدراسي الحالي.</p>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          تسمية الموسم
        </label>
        <input
          type="text"
          dir="ltr"
          className="input-field text-left"
          placeholder="2025/2026"
          value={data.schoolYearLabel}
          onChange={(e) => onChange({ schoolYearLabel: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            تاريخ البداية
          </label>
          <input
            type="date"
            className="input-field"
            value={data.schoolYearStart}
            onChange={(e) => onChange({ schoolYearStart: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            تاريخ النهاية
          </label>
          <input
            type="date"
            className="input-field"
            value={data.schoolYearEnd}
            onChange={(e) => onChange({ schoolYearEnd: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
