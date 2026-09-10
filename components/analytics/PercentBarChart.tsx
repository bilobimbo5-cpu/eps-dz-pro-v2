"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function PercentBarChart({
  data,
  tooltipLabel,
  color = "#158455",
  emptyLabel = "لا توجد بيانات كافية بعد",
}: {
  data: { label: string; value: number }[];
  tooltipLabel: string;
  color?: string;
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-gray-400">{emptyLabel}</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis fontSize={12} domain={[0, 100]} unit="%" />
        <Tooltip formatter={(v: number) => [`${v}%`, tooltipLabel]} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
