import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  School,
  Users2,
  ClipboardCheck,
  ClipboardList,
  CalendarRange,
  BookOpen,
  CalendarPlus,
  Dumbbell,
  ListChecks,
  FileText,
  Boxes,
  Sparkles,
  BarChart3,
  Bell,
  CreditCard,
  Settings,
  ShieldCheck,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/schools", label: "المؤسسات", icon: School },
  { href: "/classes", label: "الأقسام", icon: Users2 },
  { href: "/students", label: "التلاميذ", icon: Users2 },
  { href: "/attendance", label: "الحضور والغياب", icon: ClipboardCheck },
  { href: "/planning", label: "التخطيط", icon: CalendarRange },
  { href: "/units", label: "الوحدات التعلمية", icon: BookOpen },
  { href: "/lessons", label: "الحصص", icon: CalendarPlus },
  { href: "/activities", label: "الأنشطة الرياضية", icon: Dumbbell },
  { href: "/exercises", label: "مكتبة التمارين", icon: ListChecks },
  { href: "/evaluations", label: "التقويم", icon: ClipboardList },
  { href: "/documents", label: "الوثائق البيداغوجية", icon: FileText },
  { href: "/equipment", label: "العتاد الرياضي", icon: Boxes },
  { href: "/ai-assistant", label: "المساعد الذكي", icon: Sparkles },
  { href: "/analytics", label: "الإحصائيات", icon: BarChart3 },
  { href: "/notifications", label: "الإشعارات", icon: Bell },
  { href: "/subscription", label: "الاشتراك", icon: CreditCard },
  { href: "/settings", label: "الإعدادات", icon: Settings },
  { href: "/admin", label: "لوحة الإدارة", icon: ShieldCheck, adminOnly: true },
];
