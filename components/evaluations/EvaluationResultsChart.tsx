"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const LEVEL_COLOR = (percent: number) => {
  if (percent >= 90) return "#158455";
  if (percent >= 75) return "#22a56a";
  if (percent >= 60) return "#45c086";
  if (percent >= 40) return "#f59e0b";
  return "#dc2626";
};

export default function EvaluationResultsChart({
  data,
}: {
  data: { name: string; percent: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-gray-400">
        لا توجد نتائج محفوظة بعد
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 32)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" domain={[0, 100]} fontSize={12} unit="%" />
        <YAxis type="category" dataKey="name" fontSize={12} width={110} />
        <Tooltip formatter={(v: number) => [`${v}%`, "نسبة الإتقان"]} />
        <Bar dataKey="percent" radius={[0, 6, 6, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={LEVEL_COLOR(entry.percent)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
