"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import JobEditForm from "@/components/JobEditForm";
import { fetchJob, updateJob } from "@/lib/api";
import type { JobResponse, JobUpdateRequest } from "@/types/job";

export default function JobEditPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params.id);

  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const handleUpdate = async (jobData: JobUpdateRequest) => {
    setUpdateLoading(true);
    setSubmitError(null);

    try {
      await updateJob(jobId, jobData);
      router.push(`/job/${jobId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to update job.");
    } finally {
      setUpdateLoading(false);
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
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Back to jobs
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 text-slate-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Edit Job
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-300">
              Update the details for "{job.title}"
            </p>
          </div>
          <Link
            href={`/job/${jobId}`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Cancel
          </Link>
        </div>

        <section className="rounded-3xl bg-white/90 p-8 shadow-sm shadow-zinc-200/50 dark:bg-zinc-950/80 dark:shadow-black/20">
          <JobEditForm job={job} onSubmit={handleUpdate} loading={updateLoading} serverError={submitError} />
        </section>
      </main>
    </div>
  );
}