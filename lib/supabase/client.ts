import { createBrowserClient } from "@supabase/ssr";

// عميل Supabase المستخدم داخل مكونات "use client"
// ملاحظة: لا نستعمل هنا generic Database الصارم لأن types/database.ts يغطي
// جزءًا فقط من الجداول (وُثّق هذا في الملف نفسه). ربطه بصرامة يتطلب توليد
// الأنواع الكاملة عبر: supabase gen types typescript --project-id <id>
// إلى أن يتم ذلك، الاستعلامات تعمل بشكل صحيح دون فحص أنواع صارم على أسماء الجداول.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
