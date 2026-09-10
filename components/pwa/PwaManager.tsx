"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { WifiOff, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { syncPendingWrites } from "@/lib/offline/sync";
import { countPendingWrites } from "@/lib/offline/db";

export default function PwaManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // تسجيل الـ Service Worker مرة واحدة
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // فشل التسجيل لا يجب أن يوقف التطبيق — يعمل عاديًا بدون دعم offline
      });
    }
  }, []);

  // مراقبة حالة الاتصال + محاولة مزامنة عند العودة
  useEffect(() => {
    const supabase = createClient();

    async function refreshPendingCount() {
      const count = await countPendingWrites();
      setPendingCount(count);
    }

    async function handleOnline() {
      setIsOnline(true);
      setSyncing(true);
      const synced = await syncPendingWrites(supabase);
      setSyncing(false);
      await refreshPendingCount();
      if (synced > 0) {
        toast.success(`تمت مزامنة ${synced} عملية كانت بانتظار الاتصال`);
      }
    }

    function handleOffline() {
      setIsOnline(false);
    }

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && pendingCount === 0 && !syncing) return null;

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-center text-xs
        font-medium text-white print:hidden ${isOnline ? "bg-amber-500" : "bg-gray-800"}`}
    >
      {!isOnline && (
        <>
          <WifiOff size={14} />
          أنت غير متصل — بياناتك المحفوظة سابقًا متاحة، وأي تعديل سيُزامَن تلقائيًا عند عودة الاتصال
        </>
      )}
      {isOnline && syncing && (
        <>
          <RefreshCw size={14} className="animate-spin" />
          جارٍ مزامنة {pendingCount > 0 ? `${pendingCount} عملية` : "البيانات"} المعلّقة...
        </>
      )}
      {isOnline && !syncing && pendingCount > 0 && (
        <>
          <RefreshCw size={14} />
          {pendingCount} عملية بانتظار المزامنة
        </>
      )}
    </div>
  );
}
