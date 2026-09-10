import type { OnboardingData } from "@/types/onboarding";

export default function StepName({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">مرحبًا بك 👋</h3>
      <p className="text-sm text-gray-500">
        لنبدأ بإعداد مساحة عملك. ما اسمك الكامل كما تريد أن يظهر في الوثائق الرسمية؟
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          الاسم واللقب
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="مثال: أحمد بن علي"
          value={data.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
        />
      </div>
    </div>
  );
}
