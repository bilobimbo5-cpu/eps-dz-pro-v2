import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const targetUserId: string = body?.userId || user.id;
  const isDeletingSelf = targetUserId === user.id;

  // حذف حساب آخر غير حسابك الخاص يتطلب صلاحية admin
  if (!isDeletingSelf) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرّح لك بحذف هذا الحساب" },
        { status: 403 }
      );
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "لم يتم إعداد صلاحية الحذف على السيرفر (SUPABASE_SERVICE_ROLE_KEY). أضِفها في متغيرات البيئة.",
      },
      { status: 500 }
    );
  }

  // عميل بصلاحيات إدارية كاملة (service_role) — يُستعمل هنا فقط، على السيرفر،
  // ولا يصل أبدًا إلى المتصفح. حذف المستخدم من auth.users يُفعّل تلقائيًا
  // "on delete cascade" في كل الجداول المرتبطة (schools, classes, students,
  // documents...)، فلا حاجة لحذفها يدويًا.
  const supabaseAdmin = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
