import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-primary-700">EPS DZ PRO</h1>
        <p className="mt-1 text-sm text-gray-500">لنجهّز مساحة عملك في دقيقتين</p>
      </div>
      <OnboardingWizard
        userId={user.id}
        defaultFullName={profile?.full_name ?? ""}
      />
    </main>
  );
}
