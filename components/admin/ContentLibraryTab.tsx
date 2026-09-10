"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

type ActivityRow = {
  id: string;
  name: string;
  domain: string | null;
  duration_minutes: number | null;
  levels: { code: string } | null;
};

export default function ContentLibraryTab() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [levels, setLevels] = useState<{ id: string; code: string }[]>([]);
  const [form, setForm] = useState({ name: "", domain: "", level_id: "", duration_minutes: 30 });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [activitiesRes, levelsRes] = await Promise.all([
      supabase
        .from("activities")
        .select("id, name, domain, duration_minutes, levels(code)")
        .eq("is_public", true)
        .order("name"),
      supabase.from("levels").select("id, code").eq("is_active", true).order("sort_order"),
    ]);
    setActivities((activitiesRes.data ?? []) as unknown as ActivityRow[]);
    setLevels(levelsRes.data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("أدخل اسم النشاط");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("activities").insert({
      teacher_id: null,
      name: form.name,
      domain: form.domain || null,
      level_id: form.level_id || null,
      duration_minutes: form.duration_minutes || null,
      is_public: true,
    });
    setSaving(false);
    if (error) {
      toast.error("تعذّر إضافة النشاط");
      return;
    }
    toast.success("تمت إضافة النشاط إلى المكتبة العامة");
    setForm({ name: "", domain: "", level_id: "", duration_minutes: 30 });
    loadData();
  }

  async function handleRemove(id: string) {
    const { error } = await supabase.from("activities").update({ is_public: false }).eq("id", id);
    if (error) {
      toast.error("تعذّر الإزالة");
      return;
    }
    toast.success("تمت إزالة النشاط من المكتبة العامة");
    loadData();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        الأنشطة هنا تظهر لكل الأساتذة كمحتوى معتمد عند بناء الحصص والوحدات التعلمية.
      </p>

      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        <input
          className="input-field sm:col-span-2"
          placeholder="اسم النشاط"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
        <input
          className="input-field"
          placeholder="المجال"
          value={form.domain}
          onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
        />
        <select
          className="input-field"
          value={form.level_id}
          onChange={(e) => setForm((p) => ({ ...p, level_id: e.target.value }))}
        >
          <option value="">كل المستويات</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            className="input-field"
            value={form.duration_minutes}
            onChange={(e) => setForm((p) => ({ ...p, duration_minutes: Number(e.target.value) }))}
          />
          <button type="submit" disabled={saving} className="btn-primary w-auto shrink-0 px-3">
            <Plus size={18} />
          </button>
        </div>
      </form>

      {loading ? (
        <Spinner />
      ) : activities.length === 0 ? (
        <EmptyState icon={Dumbbell} title="لا يوجد محتوى عام بعد" description="" />
      ) : (
        <ul className="space-y-2">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <div>
                <span className="font-medium">{activity.name}</span>
                <span className="mr-2 text-xs text-gray-400">
                  {activity.domain} {activity.levels?.code && `· ${activity.levels.code}`}
                  {activity.duration_minutes && ` · ${activity.duration_minutes} د`}
                </span>
              </div>
              <button
                onClick={() => handleRemove(activity.id)}
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
