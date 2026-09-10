"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsRight, ChevronsLeft } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";

export default function Sidebar({
  collapsed,
  onToggle,
  isAdmin,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  isAdmin: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* خلفية شفافة عند فتح القائمة على الهاتف */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-40 flex h-full flex-col border-l border-gray-200
        bg-white transition-all duration-200 print:hidden dark:border-gray-800 dark:bg-gray-900
        ${collapsed ? "w-20" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <span className="text-lg font-bold text-primary-700">EPS DZ PRO</span>
          )}
          <button
            onClick={onToggle}
            className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block dark:hover:bg-gray-800"
            aria-label="طي القائمة"
          >
            {collapsed ? (
              <ChevronsLeft size={18} />
            ) : (
              <ChevronsRight size={18} />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
                ${
                  active
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
