"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  Megaphone,
  MessageSquare,
  Check,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import { generateSmartNotifications } from "@/lib/notifications/generate";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
};

const TYPE_ICONS: Record<string, typeof Bell> = {
  lesson_reminder: CalendarClock,
  attendance_reminder: ClipboardCheck,
  subscription_expiry: CreditCard,
  platform_update: Megaphone,
  admin_message: MessageSquare,
};

const TYPE_STYLES: Record<string, string> = {
  lesson_reminder: "bg-blue-50 text-blue-600 dark:bg-blue-950",
  attendance_reminder: "bg-amber-50 text-amber-600 dark:bg-amber-950",
  subscription_expiry: "bg-red-50 text-red-600 dark:bg-red-950",
  platform_update: "bg-primary-50 text-primary-600 dark:bg-primary-950",
  admin_message: "bg-gray-100 text-gray-600 dark:bg-gray-800",
};

export default function NotificationsPage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, message, is_read, created_at")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    setNotifications(data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    async function init() {
      // نولّد الإشعارات الذكية أولًا (تذكيرات الحصص، الحضور، الاشتراك) ثم نحمّل القائمة
      await generateSmartNotifications(supabase, teacherId);
      await loadData();
    }
    init();
  }, [supabase, teacherId, loadData]);

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("تم تحديد الكل كمقروء");
  }

  async function deleteNotification(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">الإشعارات</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : "لا توجد إشعارات جديدة"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary w-auto px-4">
            <CheckCheck size={16} className="ml-1" />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            filter === "all"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          الكل ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            filter === "unread"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          غير مقروء ({unreadCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title="لا توجد إشعارات"
            description="ستظهر هنا تذكيرات الحصص، الحضور، والاشتراك تلقائيًا"
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            return (
              <li
                key={n.id}
                className={`card flex items-start gap-3 ${!n.is_read ? "border-primary-200" : ""}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TYPE_STYLES[n.type] ?? "bg-gray-100"}`}>
                  <Icon size={16} />
                </span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium text-gray-600 dark:text-gray-300"}`}>
                      {n.title}
                    </p>
                    {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
                  </div>
                  {n.message && <p className="mt-1 text-xs text-gray-500">{n.message}</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleDateString("ar-DZ", {
                      day: "2-digit",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="تحديد كمقروء"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                    aria-label="حذف"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
