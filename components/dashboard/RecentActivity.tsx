import { FileText, Dumbbell } from "lucide-react";
import type { RecentActivityItem } from "@/lib/dashboard/queries";

export default function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  return (
    <div className="card">
      <h3 className="mb-4 text-base font-semibold">آخر الأنشطة</h3>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          لا توجد أنشطة بعد. ابدأ بإنشاء حصة أو وثيقة جديدة.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`} className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  item.type === "lesson"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950"
                    : "bg-primary-50 text-primary-600 dark:bg-primary-950"
                }`}
              >
                {item.type === "lesson" ? <Dumbbell size={16} /> : <FileText size={16} />}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-gray-400">
                  {new Date(item.date).toLocaleDateString("ar-DZ", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
