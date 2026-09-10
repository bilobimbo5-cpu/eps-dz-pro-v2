import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DocumentPreview from "@/components/documents/DocumentPreview";
import DocumentActions from "@/components/documents/DocumentActions";

export default async function DocumentViewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: document } = await supabase
    .from("documents")
    .select("id, title, data, created_at, document_types(code, label_ar)")
    .eq("id", params.id)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!document) notFound();

  const { data: teacherProfile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const docType = document.document_types as unknown as { code: string; label_ar: string } | null;
  const data = document.data as any;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowRight size={16} />
          العودة إلى الوثائق
        </Link>
        <DocumentActions documentId={document.id} />
      </div>

      <DocumentPreview
        typeCode={docType?.code ?? ""}
        title={document.title}
        teacherName={teacherProfile?.full_name ?? "أستاذ"}
        schoolName={data?.school_name}
        date={document.created_at}
        data={data}
      />
    </div>
  );
}
