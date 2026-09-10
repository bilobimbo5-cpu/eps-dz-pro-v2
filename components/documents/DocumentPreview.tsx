import DocumentHeader from "./DocumentHeader";

const EVAL_TYPE_LABELS: Record<string, string> = {
  diagnostic: "التقويم التشخيصي",
  formative: "التقويم التكويني",
  summative: "التقويم الختامي",
};

function ClassListPreview({ data }: { data: any }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-300 text-right">
          <th className="py-2">#</th>
          <th className="py-2">الاسم الكامل</th>
          <th className="py-2">الجنس</th>
          <th className="py-2">الرقم الداخلي</th>
          <th className="py-2">ملاحظة</th>
        </tr>
      </thead>
      <tbody>
        {data.students.map((s: any) => (
          <tr key={s.index} className="border-b border-gray-100">
            <td className="py-1.5">{s.index}</td>
            <td className="py-1.5 font-medium">{s.full_name}</td>
            <td className="py-1.5">{s.gender}</td>
            <td className="py-1.5">{s.internal_number}</td>
            <td className="py-1.5 text-xs text-amber-600">
              {s.has_medical_exemption ? "إعفاء طبي" : ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MonthlyAttendancePreview({ data }: { data: any }) {
  return (
    <>
      <p className="mb-3 text-sm text-gray-500">
        شهر {data.month_label} — عدد الحصص المسجّلة: {data.sessions_count}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-right">
            <th className="py-2">التلميذ</th>
            <th className="py-2 text-center">حضور</th>
            <th className="py-2 text-center">غياب</th>
            <th className="py-2 text-center">تأخر</th>
            <th className="py-2 text-center">إعفاء</th>
            <th className="py-2 text-center">نسبة الحضور</th>
          </tr>
        </thead>
        <tbody>
          {data.students.map((s: any, i: number) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1.5 font-medium">{s.full_name}</td>
              <td className="py-1.5 text-center">{s.present}</td>
              <td className="py-1.5 text-center text-red-600">{s.absent}</td>
              <td className="py-1.5 text-center text-amber-600">{s.late}</td>
              <td className="py-1.5 text-center text-blue-600">{s.exempted}</td>
              <td className="py-1.5 text-center font-semibold">{s.rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function LessonNotePreview({ data }: { data: any }) {
  const rows: [string, string | null][] = [
    ["النشاط", data.activity_name],
    ["الوحدة التعلمية", data.unit_title],
    ["المدة", data.duration_minutes ? `${data.duration_minutes} دقيقة` : null],
    ["الهدف التعلمي", data.objective],
    ["الكفاءة", data.competency],
  ];
  const sections: [string, string | null][] = [
    ["وضعية الانطلاق", data.starting_situation],
    ["الإحماء", data.warm_up],
    ["الوضعية التعليمية الأولى", data.teaching_situation_1],
    ["الوضعية التعليمية الثانية", data.teaching_situation_2],
    ["الوضعية الإدماجية", data.integration_situation],
    ["التقويم", data.evaluation],
    ["العودة إلى الهدوء", data.cool_down],
    ["التنظيم", data.organization],
    ["معايير النجاح", data.success_criteria],
    ["ملاحظات", data.notes],
  ];

  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-2 gap-3">
        {rows.map(
          ([label, value]) =>
            value && (
              <div key={label}>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            )
        )}
      </dl>
      {sections.map(
        ([title, content]) =>
          content && (
            <div key={title} className="border-t border-gray-100 pt-3">
              <h4 className="mb-1 text-sm font-semibold">{title}</h4>
              <p className="whitespace-pre-line text-gray-600 dark:text-gray-300">{content}</p>
            </div>
          )
      )}
    </div>
  );
}

function EvaluationGridPreview({ data }: { data: any }) {
  return (
    <>
      <p className="mb-3 text-sm text-gray-500">
        {EVAL_TYPE_LABELS[data.eval_type] || "التقويم"} — {data.activity_name || "بدون نشاط محدد"}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-right">
            <th className="py-2">التلميذ</th>
            {data.criteria.map((c: any, i: number) => (
              <th key={i} className="py-2 text-center">
                {c.label}
                <div className="text-[10px] text-gray-400">/{c.max_score}</div>
              </th>
            ))}
            <th className="py-2 text-center">المجموع</th>
            <th className="py-2 text-center">النسبة</th>
          </tr>
        </thead>
        <tbody>
          {data.students.map((s: any, i: number) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1.5 font-medium">{s.full_name}</td>
              {s.scores.map((score: number, j: number) => (
                <td key={j} className="py-1.5 text-center">
                  {score}
                </td>
              ))}
              <td className="py-1.5 text-center font-medium">
                {s.total}/{data.max_total}
              </td>
              <td className="py-1.5 text-center font-semibold">{s.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function GenericPreview({ data }: { data: any }) {
  return (
    <div className="space-y-3 text-sm">
      {data.notes ? (
        <p className="whitespace-pre-line leading-relaxed text-gray-700 dark:text-gray-300">
          {data.notes}
        </p>
      ) : (
        <p className="text-gray-400">لا يوجد محتوى مُدخل بعد لهذه الوثيقة.</p>
      )}
    </div>
  );
}

export default function DocumentPreview({
  typeCode,
  title,
  teacherName,
  schoolName,
  date,
  data,
}: {
  typeCode: string;
  title: string;
  teacherName: string;
  schoolName?: string;
  date?: string;
  data: any;
}) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900" dir="rtl">
      <DocumentHeader title={title} teacherName={teacherName} schoolName={schoolName} date={date} />

      {typeCode === "class_list" && <ClassListPreview data={data} />}
      {typeCode === "monthly_attendance" && <MonthlyAttendancePreview data={data} />}
      {typeCode === "lesson_note" && <LessonNotePreview data={data} />}
      {["diagnostic_grid", "formative_grid", "summative_grid"].includes(typeCode) && (
        <EvaluationGridPreview data={data} />
      )}
      {![
        "class_list",
        "monthly_attendance",
        "lesson_note",
        "diagnostic_grid",
        "formative_grid",
        "summative_grid",
      ].includes(typeCode) && <GenericPreview data={data} />}

      <div className="mt-10 flex justify-between text-xs text-gray-400">
        <span>وثيقة مولّدة عبر EPS DZ PRO</span>
        <span>الإمضاء: ..............................</span>
      </div>
    </div>
  );
}
