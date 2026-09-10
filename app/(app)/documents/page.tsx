"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FileText, Search, Star, Trash2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/context/UserContext";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type DocumentType = {
  id: string;
  code: string;
  category: string;
  label_ar: string;
};

type DocumentRow = {
  id: string;
  title: string;
  is_favorite: boolean;
  created_at: string;
  document_types: { label_ar: string; code: string } | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  planning: "التخطيط والتنظيم",
  lesson: "المذكرات والبطاقات",
  evaluation: "التقويم والمتابعة",
  attendance: "الحضور والغياب",
  classes: "الأقسام والأفواج",
  student: "وثائق التلميذ",
  follow_up: "المتابعة البيداغوجية",
  report: "التقارير",
  activity: "الأنشطة والفعاليات",
  equipment: "العتاد والوسائل",
  safety: "السلامة والتنظيم",
  yearly: "الوثائق السنوية",
};

export default function DocumentsPage() {
  const supabase = createClient();
  const { id: teacherId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [typesRes, docsRes] = await Promise.all([
      supabase.from("document_types").select("id, code, category, label_ar").eq("is_active", true),
      supabase
        .from("documents")
        .select("id, title, is_favorite, created_at, document_types(label_ar, code)")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false }),
    ]);
    setDocumentTypes(typesRes.data ?? []);
    setDocuments((docsRes.data ?? []) as unknown as DocumentRow[]);
    setLoading(false);
  }, [supabase, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleFavorite(doc: DocumentRow) {
    const { error } = await supabase
      .from("documents")
      .update({ is_favorite: !doc.is_favorite })
      .eq("id", doc.id);
    if (!error) loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("documents").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("تعذّر حذف الوثيقة");
      return;
    }
    toast.success("تم حذف الوثيقة");
    setDeleteTarget(null);
    loadData();
  }

  const groupedTypes = documentTypes.reduce<Record<string, DocumentType[]>>((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {});

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">الوثائق البيداغوجية</h1>
        <p className="text-sm text-gray-500">
          أدخل بياناتك مرة واحدة في المنصة، ودع النظام يُنشئ لك الوثائق تلقائيًا
        </p>
      </div>

      {/* اختيار نوع الوثيقة */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">+ إنشاء وثيقة جديدة</h2>
        {Object.entries(groupedTypes).map(([category, types]) => (
          <div key={category} className="card">
            <h3 className="mb-3 text-sm font-semibold text-gray-500">
              {CATEGORY_LABELS[category] || category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <Link
                  key={type.id}
                  href={`/documents/new?type=${type.code}`}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600
                    transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700
                    dark:border-gray-800 dark:text-gray-300 dark:hover:bg-primary-950"
                >
                  {type.label_ar}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* الوثائق المحفوظة */}
      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold">وثائقي ({documents.length})</h2>
          <div className="relative max-w-sm">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pr-9"
              placeholder="ابحث في الوثائق..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={FileText}
              title="لا توجد وثائق محفوظة بعد"
              description="اختر نوع وثيقة من الأعلى لتوليدها تلقائيًا من بياناتك"
            />
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-medium">العنوان</th>
                  <th className="px-4 py-3 font-medium">النوع</th>
                  <th className="px-4 py-3 font-medium">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium">{doc.title}</td>
                    <td className="px-4 py-3 text-gray-500">{doc.document_types?.label_ar}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString("ar-DZ")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleFavorite(doc)}
                          className={`rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                            doc.is_favorite ? "text-amber-500" : "text-gray-400"
                          }`}
                        >
                          <Star size={16} fill={doc.is_favorite ? "currentColor" : "none"} />
                        </button>
                        <Link
                          href={`/documents/${doc.id}`}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الوثيقة"
        message={`هل أنت متأكد من حذف "${deleteTarget?.title}"؟`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
