export default function DashboardLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded-2xl border border-[#DCE4EE] bg-white p-4 ${index < 2 ? "h-44" : "h-32"}`}
        >
          <div className="mb-3 h-4 w-28 rounded bg-[#E8EEF6]" />
          <div className="h-7 w-24 rounded bg-[#E8EEF6]" />
          <div className="mt-4 h-3 w-full rounded bg-[#EFF3F8]" />
          <div className="mt-2 h-3 w-2/3 rounded bg-[#EFF3F8]" />
        </div>
      ))}
    </div>
  );
}
