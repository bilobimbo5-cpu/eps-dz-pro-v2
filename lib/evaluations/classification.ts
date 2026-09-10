export type PerformanceLevel = "excellent" | "very_good" | "good" | "average" | "needs_support";

export const PERFORMANCE_LABELS: Record<PerformanceLevel, string> = {
  excellent: "ممتاز",
  very_good: "جيد جدًا",
  good: "جيد",
  average: "متوسط",
  needs_support: "يحتاج إلى دعم",
};

export const PERFORMANCE_STYLES: Record<PerformanceLevel, string> = {
  excellent: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  very_good: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  good: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  average: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  needs_support: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

/**
 * تصنيف نسبة الإتقان (0-100) إلى مستوى أداء وفق السلّم البيداغوجي المعتمد.
 */
export function classifyPerformance(percent: number): PerformanceLevel {
  if (percent >= 90) return "excellent";
  if (percent >= 75) return "very_good";
  if (percent >= 60) return "good";
  if (percent >= 40) return "average";
  return "needs_support";
}
