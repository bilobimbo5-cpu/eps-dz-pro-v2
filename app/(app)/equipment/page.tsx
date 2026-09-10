"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Boxes, Plus, Pencil, Trash2, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import { exportToCsv } from "@/lib/utils/csv";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatCard from "@/components/dashboard/StatCard";
import EquipmentFormModal, { type EquipmentFormValues } from "@/components/equipment/EquipmentFormModal";

type EquipmentRow = {
  id: string;
  name: string;
  type: string | null;
  quantity: number;
  condition: "good" | "medium" | "damaged" | "needs_repair";
  storage_location: string | null;
  acquisition_date: string | null;
  school_id: string | null;
  notes: string | null;
  schools: { name: string } | null;
};

const CONDITION_LABELS: Record<EquipmentRow["condition"], string> = {
  good: "جيد",
  medium: "متوسط",
  damaged: "تالف",
  needs_repair: "بحاجة إلى إصلاح",
};

const CONDITION_STYLES: Record<EquipmentRow["condition"], string> = {
  good: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  damaged: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  needs_repair: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
};

export default function EquipmentPage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EquipmentRow[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [conditionFilter, setConditionFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentFormValues | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<EquipmentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [itemsRes, schoolsRes] = await Promise.all([
      supabase
        .from("equipment")
        .select("id, name, type, quantity, condition, storage_location, acquisition_date, school_id, notes, schools(name)")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false }),
      supabase.from("schools").select("id, name").eq("teacher_id", teacherId),
    ]);
    setItems((itemsRes.data ?? []) as unknown as EquipmentRow[]);
    setSchools(schoolsRes.data ?? []);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    setEditingItem(undefined);
    setModalOpen(true);
  }

  function openEdit(item: EquipmentRow) {
    setEditingItem({
      id: item.id,
      name: item.name,
      type: item.type ?? "",
      quantity: item.quantity,
      condition: item.condition,
      storage_location: item.storage_location ?? "",
      acquisition_date: item.acquisition_date ?? "",
      school_id: item.school_id ?? "",
      notes: item.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("equipment").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("تعذّر حذف العتاد");
      return;
    }
    toast.success("تم حذف العتاد");
    setDeleteTarget(null);
    loadData();
  }

  function handleExport() {
    if (filtered.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    exportToCsv(
      "جرد_العتاد_الرياضي",
      filtered.map((i) => ({
        الاسم: i.name,
        النوع: i.type ?? "",
        العدد: i.quantity,
        الحالة: CONDITION_LABELS[i.condition],
        "مكان التخزين": i.storage_location ?? "",
        المؤسسة: i.schools?.name ?? "",
      }))
    );
    toast.success("تم تصدير الملف");
  }

  const filtered = items.filter((i) => !conditionFilter || i.condition === conditionFilter);

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const damagedCount = items.filter((i) => i.condition === "damaged").length;
  const needsRepairCount = items.filter((i) => i.condition === "needs_repair").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">العتاد الرياضي</h1>
          <p className="text-sm text-gray-500">جرد ومتابعة حالة الأدوات والمعدات</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary w-auto px-4">
            <Download size={18} className="ml-1" />
            تصدير CSV
          </button>
          <button onClick={openCreate} className="btn-primary w-auto px-5">
            <Plus size={18} className="ml-1" />
            إضافة عتاد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Boxes} label="أصناف العتاد" value={items.length} accent="blue" />
        <StatCard icon={Boxes} label="إجمالي القطع" value={totalQuantity} accent="primary" />
        <StatCard icon={Boxes} label="تالف" value={damagedCount} accent="red" />
        <StatCard icon={Boxes} label="بحاجة إلى إصلاح" value={needsRepairCount} accent="amber" />
      </div>

      <select
        className="input-field max-w-xs"
        value={conditionFilter}
        onChange={(e) => setConditionFilter(e.target.value)}
      >
        <option value="">كل الحالات</option>
        {(Object.keys(CONDITION_LABELS) as EquipmentRow["condition"][]).map((c) => (
          <option key={c} value={c}>
            {CONDITION_LABELS[c]}
          </option>
        ))}
      </select>

      <div className="card overflow-x-auto p-0">
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={conditionFilter ? "لا توجد نتائج" : "لا يوجد عتاد مسجّل بعد"}
            description={conditionFilter ? "جرّب فلترًا آخر" : "أضف أول قطعة عتاد لبدء الجرد"}
            actionLabel={conditionFilter ? undefined : "إضافة عتاد"}
            onAction={conditionFilter ? undefined : openCreate}
          />
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium">الاسم</th>
                <th className="px-4 py-3 font-medium">النوع</th>
                <th className="px-4 py-3 font-medium">العدد</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium">مكان التخزين</th>
                <th className="px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.type || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{item.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${CONDITION_STYLES[item.condition]}`}>
                      {CONDITION_LABELS[item.condition]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.storage_location || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <EquipmentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        teacherId={teacherId}
        schools={schools}
        initialValues={editingItem}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف العتاد"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
