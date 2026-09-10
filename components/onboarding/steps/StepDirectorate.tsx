import type { OnboardingData } from "@/types/onboarding";

export default function StepDirectorate({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">مديرية التربية</h3>
      <p className="text-sm text-gray-500">
        أدخل اسم مديرية التربية التابع لها (يظهر هذا في الوثائق الرسمية).
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          مديرية التربية
        </label>
        <input
          type="text"
          className="input-field"
          placeholder={`مثال: مديرية التربية لولاية ${data.wilaya || "..."}`}
          value={data.educationDirectorate}
          onChange={(e) => onChange({ educationDirectorate: e.target.value })}
        />
      </div>
    </div>
  );
}
