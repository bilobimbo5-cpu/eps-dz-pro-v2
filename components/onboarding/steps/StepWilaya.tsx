import { ALGERIA_WILAYAS } from "@/lib/constants/wilayas";
import type { OnboardingData } from "@/types/onboarding";

export default function StepWilaya({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">أين تعمل؟</h3>
      <p className="text-sm text-gray-500">اختر الولاية التي تمارس فيها عملك.</p>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          الولاية
        </label>
        <select
          className="input-field"
          value={data.wilaya}
          onChange={(e) => onChange({ wilaya: e.target.value })}
        >
          <option value="">اختر الولاية...</option>
          {ALGERIA_WILAYAS.map((w) => (
            <option key={w.code} value={w.name}>
              {w.code} - {w.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
