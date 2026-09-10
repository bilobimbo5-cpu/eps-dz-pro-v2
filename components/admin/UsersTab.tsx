"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "teacher";
  is_active: boolean;
  created_at: string;
  subscriptions: { plan: string; status: string }[] | null;
};

const PLAN_LABELS: Record<string, string> = { free: "مجاني", basic: "أساسي", pro: "احترافي" };
const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  expired: "منتهي",
  cancelled: "ملغى",
  pending: "قيد الانتظار",
};

export default function UsersTab() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select("id, full_name, email, role, is_active, created_at, subscriptions(plan, status)")
      .order("created_at", { ascending: false });
    setUsers((data ?? []) as unknown as UserRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function toggleActive(user: UserRow) {
    const { error } = await supabase
      .from("users")
      .update({ is_active: !user.is_active })
      .eq("id", user.id);
    if (error) {
      toast.error("تعذّر تحديث الحالة");
      return;
    }
    toast.success(user.is_active ? "تم تعطيل الحساب" : "تم تفعيل الحساب");
    loadUsers();
  }

  async function toggleRole(user: UserRow) {
    const nextRole = user.role === "admin" ? "teacher" : "admin";
    const { error } = await supabase.from("users").update({ role: nextRole }).eq("id", user.id);
    if (error) {
      toast.error("تعذّر تحديث الصلاحية");
      return;
    }
    toast.success(`تم تحويل المستخدم إلى ${nextRole === "admin" ? "إدارة" : "أستاذ"}`);
    loadUsers();
  }

  if (loading) return <Spinner />;

  if (users.length === 0) {
    return <EmptyState icon={Users2} title="لا يوجد مستخدمون" description="" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-sm">
        <thead className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800">
          <tr>
            <th className="px-4 py-3 font-medium">الاسم</th>
            <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
            <th className="px-4 py-3 font-medium">الاشتراك</th>
            <th className="px-4 py-3 font-medium">الصلاحية</th>
            <th className="px-4 py-3 font-medium">الحالة</th>
            <th className="px-4 py-3 font-medium">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {users.map((user) => {
            const sub = user.subscriptions?.[0];
            return (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium">{user.full_name}</td>
                <td className="px-4 py-3 text-gray-500" dir="ltr">
                  {user.email}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {sub ? `${PLAN_LABELS[sub.plan]} · ${STATUS_LABELS[sub.status]}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {user.role === "admin" ? "إدارة" : "أستاذ"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.is_active
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                        : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {user.is_active ? "نشط" : "معطّل"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(user)} className="btn-secondary w-auto px-3 py-1.5 text-xs">
                      {user.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                    <button onClick={() => toggleRole(user)} className="btn-secondary w-auto px-3 py-1.5 text-xs">
                      {user.role === "admin" ? "إلغاء الإدارة" : "ترقية لإدارة"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
