"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Printer, Copy, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DocumentActions({ documentId }: { documentId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDuplicate() {
    setBusy(true);
    const { data: original } = await supabase.from("documents").select("*").eq("id", documentId).single();

    if (!original) {
      setBusy(false);
      toast.error("تعذّر نسخ الوثيقة");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...rest } = original;
    const { data: copy, error } = await supabase
      .from("documents")
      .insert({ ...rest, title: `${rest.title} (نسخة)` })
      .select("id")
      .single();
    setBusy(false);

    if (error || !copy) {
      toast.error("تعذّر نسخ الوثيقة");
      return;
    }
    toast.success("تم إنشاء نسخة من الوثيقة");
    router.push(`/documents/${copy.id}`);
  }

  async function handleDelete() {
    setBusy(true);
    const { error } = await supabase.from("documents").delete().eq("id", documentId);
    setBusy(false);
    if (error) {
      toast.error("تعذّر حذف الوثيقة");
      return;
    }
    toast.success("تم حذف الوثيقة");
    router.push("/documents");
  }

  return (
    <>
      <div className="flex gap-2 print:hidden">
        <button onClick={() => window.print()} className="btn-secondary w-auto px-4">
          <Printer size={16} className="ml-1" />
          طباعة
        </button>
        <button onClick={handleDuplicate} disabled={busy} className="btn-secondary w-auto px-4">
          <Copy size={16} className="ml-1" />
          نسخ
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={busy}
          className="inline-flex w-auto items-center justify-center rounded-xl border border-red-200 px-4 py-3
            text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
        >
          <Trash2 size={16} className="ml-1" />
          حذف
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="حذف الوثيقة"
        message="هل أنت متأكد من حذف هذه الوثيقة؟ لا يمكن التراجع عن هذا الإجراء."
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
