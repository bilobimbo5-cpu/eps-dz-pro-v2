"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartPoint } from "@/lib/dashboard/queries";

const PIE_COLORS = ["#158455", "#45c086", "#7bd9a9", "#afeac8", "#22a56a"];

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-gray-400">
      {label}
    </div>
  );
}

export function AttendanceTrendChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return <EmptyState label="لا توجد بيانات حضور بعد" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis fontSize={12} unit="%" domain={[0, 100]} />
        <Tooltip formatter={(v: number) => [`${v}%`, "نسبة الحضور"]} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#158455"
          strokeWidth={2.5}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StudentsPerClassChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return <EmptyState label="لا توجد أقسام بعد" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip formatter={(v: number) => [v, "عدد التلاميذ"]} />
        <Bar dataKey="value" fill="#22a56a" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EvaluationAveragesChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return <EmptyState label="لا توجد تقييمات بعد" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" domain={[0, 100]} fontSize={12} unit="%" />
        <YAxis type="category" dataKey="label" fontSize={12} width={90} />
        <Tooltip formatter={(v: number) => [`${v}%`, "متوسط النتائج"]} />
        <Bar dataKey="value" fill="#45c086" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ClassesByLevelChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return <EmptyState label="لا توجد أقسام بعد" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={(entry) => `${entry.label} (${entry.value})`}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
