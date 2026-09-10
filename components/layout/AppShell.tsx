"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({
  fullName,
  isAdmin,
  children,
}: {
  fullName: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        isAdmin={isAdmin}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`transition-all duration-200 print:mr-0 ${
          collapsed ? "lg:mr-20" : "lg:mr-64"
        }`}
      >
        <Topbar
          fullName={fullName}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />
        <main className="p-4 sm:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
