"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DeleteAccountSection() {
  const supabase = createClient();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "تعذّر حذف الحساب");
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      toast.success("تم حذف حسابك نهائيًا");
      router.push("/");
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
      setDeleting(false);
    }
  }

  return (
    <div className="card border-red-200 dark:border-red-900">
      <h3 className="flex items-center gap-2 text-base font-semibold text-red-700 dark:text-red-400">
        <AlertTriangle size={18} />
        منطقة الخطر
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        حذف حسابك نهائي وغير قابل للتراجع — سيُحذف معه كل شيء: المؤسسات، الأقسام،
        التلاميذ، الحضور، التقييمات، والوثائق.
      </p>
      <button
        onClick={() => setConfirmOpen(true)}
        className="mt-4 inline-flex w-auto items-center justify-center rounded-xl border border-red-300 px-5 py-2.5
          text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
      >
        حذف حسابي نهائيًا
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="حذف الحساب نهائيًا"
        message="هل أنت متأكد تمامًا؟ سيُحذف حسابك وكل بياناتك فورًا ولا يمكن استرجاعها بأي شكل."
        confirmLabel="نعم، احذف حسابي"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
