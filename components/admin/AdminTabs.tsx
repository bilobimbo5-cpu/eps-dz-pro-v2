"use client";

import { useState } from "react";
import { Users2, GraduationCap, FileText, Dumbbell } from "lucide-react";
import UsersTab from "./UsersTab";
import LevelsTab from "./LevelsTab";
import DocumentTypesTab from "./DocumentTypesTab";
import ContentLibraryTab from "./ContentLibraryTab";

const TABS = [
  { key: "users", label: "المستخدمون", icon: Users2 },
  { key: "levels", label: "المستويات", icon: GraduationCap },
  { key: "document_types", label: "أنواع الوثائق", icon: FileText },
  { key: "content", label: "المحتوى العام", icon: Dumbbell },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminTabs() {
  const [active, setActive] = useState<TabKey>("users");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                active === tab.key
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="card">
        {active === "users" && <UsersTab />}
        {active === "levels" && <LevelsTab />}
        {active === "document_types" && <DocumentTypesTab />}
        {active === "content" && <ContentLibraryTab />}
      </div>
    </div>
  );
}
