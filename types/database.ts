// أنواع مبسطة مطابقة لـ eps_dz_pro_schema.sql
// ملاحظة: هذا ملف مختصر يغطي الجداول المستخدمة في مرحلة Auth + Onboarding فقط.
// يُستحسن توليد الأنواع الكاملة لاحقًا عبر: supabase gen types typescript

export type Database = {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: "admin" | "teacher";
          phone: string | null;
          is_active: boolean;
          language: "ar" | "fr";
          theme: "light" | "dark";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          id: string;
          email: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      teacher_profiles: {
        Row: {
          id: string;
          user_id: string;
          wilaya: string | null;
          education_directorate: string | null;
          phase: string | null;
          onboarding_completed: boolean;
          onboarding_step: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["teacher_profiles"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["teacher_profiles"]["Row"]>;
      };
      school_years: {
        Row: {
          id: string;
          teacher_id: string;
          label: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          is_archived: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["school_years"]["Row"]> & {
          teacher_id: string;
          label: string;
          start_date: string;
          end_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["school_years"]["Row"]>;
      };
      schools: {
        Row: {
          id: string;
          teacher_id: string;
          name: string;
          address: string | null;
          commune: string | null;
          wilaya: string | null;
          director_name: string | null;
          phone: string | null;
          email: string | null;
          school_year_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["schools"]["Row"]> & {
          teacher_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["schools"]["Row"]>;
      };
      levels: {
        Row: {
          id: string;
          code: string;
          label_ar: string;
          label_fr: string | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["levels"]["Row"]> & {
          code: string;
          label_ar: string;
        };
        Update: Partial<Database["public"]["Tables"]["levels"]["Row"]>;
      };
      classes: {
        Row: {
          id: string;
          teacher_id: string;
          school_id: string;
          level_id: string;
          name: string;
          student_count: number;
          schedule: Record<string, unknown> | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["classes"]["Row"]> & {
          teacher_id: string;
          school_id: string;
          level_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Row"]>;
      };
      // ملاحظة: الجداول التالية (attendance_sessions, attendance_records, lessons,
      // documents, evaluations, evaluation_criteria, evaluation_results) مستخدمة في
      // lib/dashboard/queries.ts عبر استعلامات عامة (supabase.from(...)). أنواعها
      // الكاملة موجودة في eps_dz_pro_schema.sql؛ يُستحسن توليدها تلقائيًا لاحقًا عبر:
      // supabase gen types typescript --project-id <id> > types/database.ts
    };
  };
};
