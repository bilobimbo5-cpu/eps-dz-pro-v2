import type { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: "primary" | "amber" | "red" | "blue";
}) {
  const accentClasses: Record<string, string> = {
    primary: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentClasses[accent]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
