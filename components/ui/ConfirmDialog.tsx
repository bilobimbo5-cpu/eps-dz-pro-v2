"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "حذف",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} maxWidth="max-w-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950">
          <AlertTriangle size={20} />
        </span>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onCancel} className="btn-secondary" disabled={loading}>
          إلغاء
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-xl bg-red-600
            px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700
            disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "جارٍ الحذف..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
