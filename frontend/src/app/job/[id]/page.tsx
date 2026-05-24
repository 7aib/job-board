"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components";
import { fetchJob, deleteJob, applyToJob } from "@/lib/api";
import ApplicationModal from "@/components/ApplicationModal";
import type { JobResponse } from "@/types/job";
import type { ApplicationCreateRequest } from "@/types/application";

function getStatus(isClosed: boolean, deadline: string) {
  const deadlineDate = new Date(deadline);
  const isExpired = deadlineDate < new Date();
  return isClosed || isExpired ? "Closed" : "Open";
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params.id);

  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    if (!jobId || isNaN(jobId)) {
      setError("Invalid job ID");
      return;
    }

    let isMounted = true;

    async function loadJob() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchJob(jobId);
        if (!isMounted) return;
        setJob(data);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unable to load job details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadJob();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const handleDelete = async () => {
    if (!job) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${job.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleteLoading(true);

    try {
      await deleteJob(job.id);
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete job");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApply = async (applicationData: ApplicationCreateRequest) => {
    setApplyLoading(true);
    try {
      await applyToJob(jobId, applicationData);
      alert("Application submitted successfully!");
      setShowApplicationModal(false);
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10 text-slate-950 dark:bg-zinc-950 dark:text-zinc-50">
        <main className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/90 p-10 text-center text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-slate-300">
            Loading job details...
          </div>
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10 text-slate-950 dark:bg-zinc-950 dark:text-zinc-50">
        <main className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/80 dark:text-rose-200">
            {error || "Job not found"}
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200"
          >
            Go back
          </button>
        </main>
      </div>
    );
  }

  const status = getStatus(job.is_closed, job.deadline);
  const deadlineDate = new Date(job.deadline).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-50 py-10 text-slate-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-white/90 p-8 shadow-sm shadow-zinc-200/50 dark:bg-zinc-950/80 dark:shadow-black/20">
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                    {job.title}
                  </h1>
                  <StatusBadge status={status} />
                </div>
                <p className="text-lg text-zinc-600 dark:text-zinc-300">{job.department}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplicationModal(true)}
                  disabled={status !== "Open"}
                  title={
                    status !== "Open"
                      ? "This job is closed or the application deadline has passed."
                      : undefined
                  }
                  className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200"
                >
                  Apply
                </button>
                <Link
                  href={`/job/${jobId}/edit`}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  Edit Job
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/80 dark:text-rose-200 dark:hover:bg-rose-900/50"
                >
                  {deleteLoading ? "Deleting..." : "Delete Job"}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  Back to jobs
                </button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Location
                  </h3>
                  <p className="text-base text-zinc-900 dark:text-zinc-100">{job.location}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Salary Range
                  </h3>
                  <p className="text-base text-zinc-900 dark:text-zinc-100">
                    ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Application Deadline
                  </h3>
                  <p className="text-base text-zinc-900 dark:text-zinc-100">{deadlineDate}</p>
                </div>
                {job.max_applicants && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Max Applicants
                    </h3>
                    <p className="text-base text-zinc-900 dark:text-zinc-100">{job.max_applicants}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {job.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">
                Job Description
              </h3>
              <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">{job.description}</p>
            </div>
          </div>
        </section>
      </main>

      <ApplicationModal
        isOpen={showApplicationModal}
        jobId={jobId}
        jobTitle={job.title}
        onSubmit={handleApply}
        loading={applyLoading}
        onClose={() => {
          if (!applyLoading) setShowApplicationModal(false);
        }}
      />
    </div>
  );
}
