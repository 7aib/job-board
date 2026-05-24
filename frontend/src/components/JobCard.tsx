import Link from "next/link";
import StatusBadge from "./StatusBadge";

export interface JobCardProps {
  title: string;
  department: string;
  location: string;
  salaryRange?: string;
  description: string;
  status: string;
  deadline: string;
  maxApplicants?: number | null;
  requiredSkills?: string[];
  jobId: number;
}

export default function JobCard({
  title,
  department,
  location,
  salaryRange,
  description,
  status,
  deadline,
  maxApplicants,
  requiredSkills,
  jobId,
}: JobCardProps) {
  const deadlineDate = new Date(deadline).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm shadow-zinc-200/50 transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{department}</p>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{location}</span>
            {salaryRange ? <span>{salaryRange}</span> : null}
            <span>Deadline: {deadlineDate}</span>
            {maxApplicants ? <span>Max applicants: {maxApplicants}</span> : null}
          </div>
        </div>

        <Link
          href={`/job/${jobId}`}
          className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200"
        >
          View details
        </Link>
      </div>

      <p className="mt-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{description}</p>

      {requiredSkills?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {requiredSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
