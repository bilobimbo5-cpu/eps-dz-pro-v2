import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// عميل Supabase المستخدم داخل Server Components و Route Handlers
// ملاحظة: لا نستعمل هنا generic Database الصارم — انظر نفس الملاحظة في client.ts
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // يحدث هذا عند الاستدعاء من Server Component بدون Route Handler
            // يمكن تجاهله إذا كان middleware.ts يقوم بتحديث الجلسة
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // نفس الملاحظة أعلاه
          }
        },
      },
    }
  );
}
