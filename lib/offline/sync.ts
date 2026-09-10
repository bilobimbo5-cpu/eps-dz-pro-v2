import type { SupabaseClient } from "@supabase/supabase-js";
import { getPendingWrites, removePendingWrite, type PendingWrite } from "./db";
import { saveAttendanceSession } from "@/lib/attendance/queries";

/**
 * يُنفَّذ عند استعادة الاتصال: يمرّ على كل العمليات المعلّقة في IndexedDB
 * ويحاول تنفيذها في Supabase، ثم يحذفها من قائمة الانتظار عند النجاح.
 * يعيد عدد العمليات التي تمت مزامنتها بنجاح.
 */
export async function syncPendingWrites(supabase: SupabaseClient): Promise<number> {
  const pending = await getPendingWrites().catch(() => [] as PendingWrite[]);
  if (pending.length === 0) return 0;

  let synced = 0;

  for (const write of pending) {
    try {
      if (write.type === "attendance_session") {
        const { error } = await saveAttendanceSession(
          supabase,
          write.payload as Parameters<typeof saveAttendanceSession>[1]
        );
        if (error) continue; // نُبقيه في القائمة للمحاولة لاحقًا
      }

      if (write.id !== undefined) {
        await removePendingWrite(write.id);
        synced += 1;
      }
    } catch {
      // فشل مؤقت (مثلًا الاتصال انقطع مجددًا أثناء المزامنة): نُبقي العملية في القائمة
    }
  }

  return synced;
}
