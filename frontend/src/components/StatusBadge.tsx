interface StatusBadgeProps {
  status: string;
}

const statusClasses: Record<string, string> = {
  open: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300",
  closed: "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300",
  draft: "bg-slate-100 text-slate-900 dark:bg-slate-950/80 dark:text-slate-300",
  pending: "bg-slate-100 text-slate-900 dark:bg-slate-950/80 dark:text-slate-300",
  shortlisted: "bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-200",
  offered: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300",
};

function formatStatusLabel(status: string): string {
  const t = status.trim();
  if (!t) return status;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.trim().toLowerCase();
  const classes = statusClasses[normalized] ?? "bg-zinc-100 text-zinc-900 dark:bg-zinc-950/80 dark:text-zinc-300";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${classes}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
