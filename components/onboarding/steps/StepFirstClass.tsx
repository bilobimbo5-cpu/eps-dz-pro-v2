"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { OnboardingData } from "@/types/onboarding";

type Level = Database["public"]["Tables"]["levels"]["Row"];

export default function StepFirstClass({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const supabase = createClient();
  const [levels, setLevels] = useState<Level[]>([]);

  useEffect(() => {
    async function loadSelectedLevels() {
      if (data.levelIds.length === 0) return;
      const { data: rows } = await supabase
        .from("levels")
        .select("*")
        .in("id", data.levelIds)
        .order("sort_order");
      setLevels(rows ?? []);
      if (!data.firstClassLevelId && rows && rows.length > 0) {
        onChange({ firstClassLevelId: rows[0].id });
      }
    }
    loadSelectedLevels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.levelIds]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">إنشاء أول قسم</h3>
      <p className="text-sm text-gray-500">
        لتجربة المنصة مباشرة، أنشئ أول قسم لك الآن. يمكنك إضافة المزيد لاحقًا.
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          المستوى
        </label>
        <select
          className="input-field"
          value={data.firstClassLevelId}
          onChange={(e) => onChange({ firstClassLevelId: e.target.value })}
        >
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code} - {l.label_ar}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          اسم القسم
        </label>
        <input
          type="text"
          dir="ltr"
          className="input-field text-left"
          placeholder="مثال: 4AP1"
          value={data.firstClassName}
          onChange={(e) => onChange({ firstClassName: e.target.value })}
        />
      </div>
    </div>
  );
}
