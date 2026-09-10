export default function DocumentHeader({
  title,
  teacherName,
  schoolName,
  date,
}: {
  title: string;
  teacherName: string;
  schoolName?: string;
  date?: string;
}) {
  return (
    <div className="mb-6 border-b-2 border-primary-600 pb-4">
      <div className="flex items-start justify-between text-xs text-gray-500">
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">{teacherName}</p>
          {schoolName && <p>{schoolName}</p>}
        </div>
        <div className="text-left">
          <p className="font-semibold text-primary-700">EPS DZ PRO</p>
          <p>{date ? new Date(date).toLocaleDateString("ar-DZ") : new Date().toLocaleDateString("ar-DZ")}</p>
        </div>
      </div>
      <h1 className="mt-3 text-center text-lg font-bold">{title}</h1>
    </div>
  );
}
