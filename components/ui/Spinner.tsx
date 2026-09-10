import { Loader2 } from "lucide-react";

export default function Spinner({ label = "جارٍ التحميل..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
      <Loader2 className="animate-spin" size={24} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
