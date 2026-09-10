"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Moon, Sun, Bell, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";

export default function Topbar({
  fullName,
  onOpenMobileSidebar,
}: {
  fullName: string;
  onOpenMobileSidebar: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();
  const [dark, setDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  useEffect(() => {
    async function loadUnreadCount() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("teacher_id", teacherId)
        .eq("is_read", false);
      setUnreadCount(count ?? 0);
    }
    loadUnreadCount();
  }, [supabase, teacherId]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("eps-theme", next ? "dark" : "light");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur print:hidden dark:border-gray-800 dark:bg-gray-900/80">
      <button
        onClick={onOpenMobileSidebar}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
        aria-label="فتح القائمة"
      >
        <Menu size={20} />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="ابحث عن تلميذ، قسم، مذكرة..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-3 pr-9 text-sm
            focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100
            dark:border-gray-700 dark:bg-gray-800 dark:focus:bg-gray-900"
        />
      </div>

      <button
        onClick={toggleDark}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="تبديل الوضع الليلي"
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <button
        onClick={() => router.push("/notifications")}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="الإشعارات"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <div className="relative">
        <button
          onClick={() => setProfileOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
            {fullName?.charAt(0) || "أ"}
          </span>
          <span className="hidden text-sm font-medium sm:block">{fullName}</span>
        </button>

        {profileOpen && (
          <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <a
              href="/settings"
              className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              الإعدادات
            </a>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut size={16} />
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
