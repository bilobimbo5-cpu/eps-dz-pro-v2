"use client";

import type { AttendanceStatus } from "@/lib/attendance/queries";

const OPTIONS: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  {
    value: "present",
    label: "حاضر",
    activeClass: "bg-primary-600 text-white border-primary-600",
  },
  {
    value: "absent",
    label: "غائب",
    activeClass: "bg-red-600 text-white border-red-600",
  },
  {
    value: "late",
    label: "متأخر",
    activeClass: "bg-amber-500 text-white border-amber-500",
  },
  {
    value: "exempted",
    label: "معفى",
    activeClass: "bg-blue-500 text-white border-blue-500",
  },
];

export default function StatusToggle({
  value,
  onChange,
}: {
  value: AttendanceStatus | undefined;
  onChange: (status: AttendanceStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
            value === opt.value
              ? opt.activeClass
              : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
