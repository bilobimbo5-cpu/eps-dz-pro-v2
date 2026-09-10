import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { UserProvider } from "@/lib/context/UserContext";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role === "admin" ? "admin" : "teacher";

  return (
    <UserProvider
      user={{ id: user.id, fullName: profile?.full_name ?? "أستاذ", role }}
    >
      <AppShell fullName={profile?.full_name ?? "أستاذ"} isAdmin={role === "admin"}>
        {children}
      </AppShell>
    </UserProvider>
  );
}
