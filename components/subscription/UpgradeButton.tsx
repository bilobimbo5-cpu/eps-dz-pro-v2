"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpgradeButton({
  planKey,
  planLabel,
  priceLabel,
  alreadyRequested,
}: {
  planKey: "basic" | "pro";
  planLabel: string;
  priceLabel: string;
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

    toast.success(
      `تم تسجيل طلبك لخطة "${planLabel}" (${priceLabel}). سنتواصل معك لإتمام الدفع بالبطاقة الذهبية يدويًا حتى تفعيل الدفع الآلي`,
      { duration: 6000 }
    );
    router.refresh();
  }

  if (alreadyRequested) {
    return (
      <button disabled className="btn-secondary mt-5 disabled:opacity-70">
        طلبك قيد المعالجة — سنتواصل معك
      </button>
    );
  }

  return (
    <button onClick={handleRequest} disabled={loading} className="btn-primary mt-5">
      <CreditCard size={16} className="ml-1" />
      {loading ? "جارٍ الإرسال..." : `اشترك الآن — ${priceLabel}`}
    </button>
  );
}
