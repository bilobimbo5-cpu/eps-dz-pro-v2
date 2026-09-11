"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function UpgradeButton({
  planKey,
  planLabel,
  alreadyRequested,
}: {
  planKey: "basic" | "pro";
  planLabel: string;
  alreadyRequested: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRequest() {
    setLoading(true);
    const { error } = await supabase.rpc("request_subscription_upgrade", {
      new_plan: planKey,
    });
    setLoading(false);

    if (error) {
      toast.error("تعذّر إرسال طلب الترقية، حاول مرة أخرى");
      return;
    }

    toast.success(`تم إرسال طلب الترقية إلى "${planLabel}" — ستتم مراجعته من الإدارة قريبًا`);
    router.refresh();
  }

  if (alreadyRequested) {
    return (
      <button disabled className="btn-secondary mt-5 disabled:opacity-70">
        طلب الترقية قيد المراجعة
      </button>
    );
  }

  return (
    <button onClick={handleRequest} disabled={loading} className="btn-primary mt-5">
      {loading ? "جارٍ الإرسال..." : "طلب الترقية"}
    </button>
  );
}
