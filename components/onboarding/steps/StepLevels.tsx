"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { OnboardingData } from "@/types/onboarding";

type Level = Database["public"]["Tables"]["levels"]["Row"];

export default function StepLevels({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const supabase = createClient();
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLevels() {
      const { data: rows } = await supabase
        .from("levels")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      setLevels(rows ?? []);
      setLoading(false);
    }
    loadLevels();
  }, [supabase]);

  function toggleLevel(id: string) {
    const exists = data.levelIds.includes(id);
    onChange({
      levelIds: exists
        ? data.levelIds.filter((l) => l !== id)
        : [...data.levelIds, id],
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">المستويات التي تدرّسها</h3>
      <p className="text-sm text-gray-500">اختر مستوى واحدًا أو أكثر.</p>

      {loading ? (
        <p className="text-sm text-gray-400">جارٍ التحميل...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {levels.map((level) => {
            const selected = data.levelIds.includes(level.id);
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => toggleLevel(level.id)}
                className={`rounded-xl border p-4 text-center transition ${
                  selected
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                    : "border-gray-200 hover:border-primary-300 dark:border-gray-800"
                }`}
              >
                <span className="font-semibold">{level.code}</span>
                <p className="mt-1 text-xs text-gray-500">{level.label_ar}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
