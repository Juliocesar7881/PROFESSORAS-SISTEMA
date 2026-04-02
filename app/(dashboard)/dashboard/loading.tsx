export default function DashboardLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`glass-card rounded-2xl border-none p-4 shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)] ${index < 2 ? "h-44" : "h-32"}`}
        >
          <div className="mb-3 h-4 w-28 rounded bg-slate-200/80 skeleton-pulse" />
          <div className="h-7 w-24 rounded bg-slate-200/80 skeleton-pulse" />
          <div className="mt-4 h-3 w-full rounded bg-slate-100 skeleton-pulse" />
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-100 skeleton-pulse" />
        </div>
      ))}
    </div>
  );
}
