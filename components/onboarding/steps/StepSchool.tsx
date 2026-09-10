import type { OnboardingData } from "@/types/onboarding";

export default function StepSchool({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">المؤسسة</h3>
      <p className="text-sm text-gray-500">
        أضف المدرسة التي تعمل بها. يمكنك إضافة مؤسسات أخرى لاحقًا من لوحة التحكم.
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          اسم المؤسسة
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="مثال: مدرسة الإخوة هويبي"
          value={data.schoolName}
          onChange={(e) => onChange({ schoolName: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          البلدية
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="مثال: باب الوادي"
          value={data.schoolCommune}
          onChange={(e) => onChange({ schoolCommune: e.target.value })}
        />
      </div>
    </div>
  );
}
