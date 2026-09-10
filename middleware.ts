import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// الصفحات التي لا تتطلب تسجيل دخول
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.includes(path);

  // غير مسجل دخول ويحاول الوصول لصفحة محمية → توجيه لتسجيل الدخول
  if (!user && !isPublic) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  // مسجل دخول ويحاول الوصول لصفحات تسجيل الدخول/التسجيل → توجيه للوحة التحكم
  if (user && (path === "/login" || path === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // التحقق من اكتمال الـ Onboarding قبل الوصول للوحة التحكم أو أي صفحة داخلية
  if (user && !isPublic && path !== "/onboarding") {
    const { data: profile } = await supabase
      .from("teacher_profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.onboarding_completed === false) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * تطبيق الـ middleware على كل الصفحات ما عدا:
     * - ملفات Next.js الداخلية
     * - الملفات الثابتة (صور، أيقونات، manifest)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)",
  ],
};
