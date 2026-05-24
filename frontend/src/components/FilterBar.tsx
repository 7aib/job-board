interface FilterBarProps {
  department: string;
  location: string;
  departments: string[];
  locations: string[];
  onDepartmentChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onReset: () => void;
}

export default function FilterBar({
  department,
  location,
  departments,
  locations,
  onDepartmentChange,
  onLocationChange,
  onReset,
}: FilterBarProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-sm shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="block font-semibold">Department</span>
            <select
              value={department}
              onChange={(event) => onDepartmentChange(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
            >
              <option value="">All departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="block font-semibold">Location</span>
            <select
              value={location}
              onChange={(event) => onLocationChange(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
            >
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 px-5 text-sm font-semibold text-slate-900 transition hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
