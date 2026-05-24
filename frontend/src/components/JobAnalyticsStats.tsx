import type { StatsResponse } from "@/types/stats";

export interface JobAnalyticsStatsProps {
  stats: StatsResponse | null;
  /** True while fetching (initial or tab revisit). */
  statsLoading: boolean;
  statsRefreshing: boolean;
  error: string | null;
  onRefresh: () => void;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">{value}</p>
      {hint ? <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  );
}

export default function JobAnalyticsStats({
  stats,
  statsLoading,
  statsRefreshing,
  error,
  onRefresh,
}: JobAnalyticsStatsProps) {
  const gridDimmed = Boolean(stats && statsLoading);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Job analytics</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Live metrics from <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">GET /api/stats</code>
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={statsLoading || statsRefreshing}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          {statsRefreshing ? "Refreshing…" : statsLoading && !stats ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && stats && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/80 dark:text-rose-100"
        >
          {error}
        </div>
      )}

      {statsLoading && !stats ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/90 p-10 text-center text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-slate-300">
          Loading analytics…
        </div>
      ) : error && !stats ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/80 dark:text-rose-200">
          {error}
        </div>
      ) : stats ? (
        <div
          className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 transition-opacity ${gridDimmed ? "pointer-events-none opacity-60" : ""}`}
        >
          <StatCard label="Total jobs" value={stats.total_jobs} hint="All non-deleted listings" />
          <StatCard
            label="Open jobs"
            value={stats.open_jobs}
            hint="Not closed and deadline on or after today"
          />
          <StatCard
            label="Closed / expired"
            value={stats.closed_jobs}
            hint="Manually closed or past deadline"
          />
          <StatCard label="Total applications" value={stats.total_applications} hint="All non-deleted submissions" />
          <StatCard
            label="Avg applications per job"
            value={stats.avg_applications_per_job}
            hint="Application count ÷ job count"
          />
          <StatCard
            label="Top department (by apps)"
            value={stats.top_department ?? "—"}
            hint={stats.top_department ? "Most applications linked to jobs in this department" : "No applications yet"}
          />
        </div>
      ) : null}
    </section>
  );
}
