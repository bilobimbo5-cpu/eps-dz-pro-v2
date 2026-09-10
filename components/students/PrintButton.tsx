"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-secondary w-auto px-4 print:hidden">
      <Printer size={18} className="ml-1" />
      طباعة البطاقة
    </button>
  );
}
