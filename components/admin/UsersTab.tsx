"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Users2, Trash2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "teacher";
  is_active: boolean;
  created_at: string;
  subscriptions: { plan: string; status: string; requested_plan: string | null }[] | null;
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
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select("id, full_name, email, role, is_active, created_at, subscriptions(plan, status, requested_plan)")
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

  async function approveUpgrade(user: UserRow) {
    const requestedPlan = user.subscriptions?.[0]?.requested_plan;
    if (!requestedPlan) return;

    const { error } = await supabase
      .from("subscriptions")
      .update({ plan: requestedPlan, status: "active", requested_plan: null })
      .eq("teacher_id", user.id);

    if (error) {
      toast.error("تعذّر تفعيل الترقية");
      return;
    }
    toast.success(`تم ترقية ${user.full_name} إلى ${PLAN_LABELS[requestedPlan]}`);
    loadUsers();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "تعذّر حذف الحساب");
        setDeleting(false);
        return;
      }

      toast.success("تم حذف الحساب نهائيًا");
      setDeleteTarget(null);
      loadUsers();
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setDeleting(false);
    }
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
                  <div>{sub ? `${PLAN_LABELS[sub.plan]} · ${STATUS_LABELS[sub.status]}` : "—"}</div>
                  {sub?.requested_plan && (
                    <button
                      onClick={() => approveUpgrade(user)}
                      className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300"
                    >
                      <Check size={11} />
                      قبول الترقية إلى {PLAN_LABELS[sub.requested_plan]}
                    </button>
                  )}
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
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => toggleActive(user)} className="btn-secondary w-auto px-3 py-1.5 text-xs">
                      {user.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                    <button onClick={() => toggleRole(user)} className="btn-secondary w-auto px-3 py-1.5 text-xs">
                      {user.role === "admin" ? "إلغاء الإدارة" : "ترقية لإدارة"}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                    >
                      <Trash2 size={13} />
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الحساب نهائيًا"
        message={`هل أنت متأكد من حذف حساب "${deleteTarget?.full_name}"؟ سيُحذف نهائيًا مع كل بياناته (المؤسسات، الأقسام، التلاميذ، الوثائق...) ولا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف نهائي"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
