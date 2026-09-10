import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
        <Icon size={26} />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-xs text-sm text-gray-500">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-2 w-auto px-6">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
