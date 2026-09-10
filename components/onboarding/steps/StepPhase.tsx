import type { OnboardingData } from "@/types/onboarding";

const PHASES = [
  { value: "ابتدائي", label: "التعليم الابتدائي", available: true },
  { value: "متوسط", label: "التعليم المتوسط", available: false },
  { value: "ثانوي", label: "التعليم الثانوي", available: false },
];

export default function StepPhase({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">الطور الدراسي</h3>
      <p className="text-sm text-gray-500">
        هذه النسخة من المنصة مخصصة حاليًا للطور الابتدائي (السنة 1 إلى 5).
      </p>
      <div className="grid grid-cols-1 gap-3">
        {PHASES.map((p) => (
          <button
            key={p.value}
            type="button"
            disabled={!p.available}
            onClick={() => onChange({ phase: p.value })}
            className={`rounded-xl border p-4 text-right transition ${
              data.phase === p.value
                ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                : "border-gray-200 dark:border-gray-800"
            } ${!p.available ? "cursor-not-allowed opacity-40" : "hover:border-primary-300"}`}
          >
            <span className="font-medium">{p.label}</span>
            {!p.available && (
              <span className="mr-2 text-xs text-gray-400">(قريبًا)</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
