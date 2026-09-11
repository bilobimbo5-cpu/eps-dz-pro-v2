import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/settings/ProfileForm";
import PasswordForm from "@/components/settings/PasswordForm";
import SchoolYearArchive from "@/components/settings/SchoolYearArchive";
import DeleteAccountSection from "@/components/settings/DeleteAccountSection";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, phone, language")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">الإعدادات</h1>
        <p className="text-sm text-gray-500">إدارة ملفك الشخصي وموسمك الدراسي</p>
      </div>

      <ProfileForm
        userId={user.id}
        initialFullName={profile?.full_name ?? ""}
        initialPhone={profile?.phone ?? ""}
        initialLanguage={(profile?.language as "ar" | "fr") ?? "ar"}
      />

      <PasswordForm />

      <SchoolYearArchive teacherId={user.id} />

      <DeleteAccountSection />
    </div>
  );
}
