export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[0.85rem] border border-[#e8e3f0] bg-white p-6 shadow-[0_12px_32px_-26px_rgba(91,58,85,.32)] md:p-8">
        <div className="h-5 w-56 rounded-md skeleton-pulse" />
        <div className="mt-3 h-3 w-full max-w-md rounded-full skeleton-pulse" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[0.85rem] border border-[#e8e3f0] bg-white p-5 shadow-[0_12px_32px_-26px_rgba(91,58,85,.32)]"
          >
            <div className="mb-4 size-12 rounded-md skeleton-pulse" />
            <div className="h-5 w-32 rounded-md skeleton-pulse" />
            <div className="mt-3 h-3 w-full rounded-full skeleton-pulse" />
            <div className="mt-2 h-3 w-2/3 rounded-full skeleton-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
