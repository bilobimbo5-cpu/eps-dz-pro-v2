import Link from "next/link";
import {
  UserPlus,
  FolderPlus,
  CalendarPlus,
  FileText,
  ClipboardCheck,
  CalendarRange,
  FileDown,
} from "lucide-react";

const ACTIONS = [
  { href: "/students?action=new", label: "إضافة تلميذ", icon: UserPlus },
  { href: "/classes?action=new", label: "إنشاء قسم", icon: FolderPlus },
  { href: "/lesson-builder", label: "إنشاء حصة", icon: CalendarPlus },
  { href: "/documents/new?type=lesson_note", label: "إنشاء مذكرة", icon: FileText },
  { href: "/attendance", label: "تسجيل الحضور", icon: ClipboardCheck },
  { href: "/planning", label: "إضافة تقويم", icon: CalendarRange },
  { href: "/documents", label: "إنشاء PDF", icon: FileDown },
];

export default function QuickActions() {
  return (
    <div className="card">
      <h3 className="mb-4 text-base font-semibold">ماذا تريد أن تفعل؟</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 text-center text-sm
                font-medium text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700
                dark:border-gray-800 dark:text-gray-300 dark:hover:bg-primary-950"
            >
              <Icon size={22} />
              {action.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
