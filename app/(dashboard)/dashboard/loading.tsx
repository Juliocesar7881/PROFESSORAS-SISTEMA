export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="rounded-[1.25rem] border border-sky-100 bg-white p-6 md:p-8">
        <div className="h-5 w-56 rounded-lg bg-sky-50 skeleton-pulse" />
        <div className="mt-3 h-3 w-80 rounded bg-sky-50/60 skeleton-pulse" />
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.25rem] border border-sky-100 bg-white p-5"
          >
            <div className="mb-4 size-12 rounded-2xl bg-sky-50 skeleton-pulse" />
            <div className="h-5 w-32 rounded-lg bg-sky-50 skeleton-pulse" />
            <div className="mt-3 h-3 w-full rounded bg-sky-50/60 skeleton-pulse" />
            <div className="mt-2 h-3 w-2/3 rounded bg-sky-50/40 skeleton-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
