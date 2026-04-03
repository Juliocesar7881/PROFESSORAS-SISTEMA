export default function DashboardLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${index < 2 ? "h-44" : "h-32"}`}
        >
          <div className="mb-3 h-4 w-28 rounded bg-gray-100 skeleton-pulse" />
          <div className="h-7 w-24 rounded bg-gray-100 skeleton-pulse" />
          <div className="mt-4 h-3 w-full rounded bg-gray-50 skeleton-pulse" />
          <div className="mt-2 h-3 w-2/3 rounded bg-gray-50 skeleton-pulse" />
        </div>
      ))}
    </div>
  );
}
