"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import JobCreateForm from "@/components/JobCreateForm";
import { createJob } from "@/lib/api";
import type { JobCreateRequest } from "@/types/job";

export default function JobCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (jobData: JobCreateRequest) => {
    setLoading(true);
    setError(null);

    try {
      const createdJob = await createJob(jobData);
      router.push(`/job/${createdJob.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-10 text-slate-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-white/90 p-8 shadow-sm shadow-zinc-200/50 dark:bg-zinc-950/80 dark:shadow-black/20">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                  Create new job
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Post a Job Listing
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  Fill out the form below to create a new job listing. All fields marked with * are required.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                Back to jobs
              </Link>
            </div>

            {error && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/80 dark:text-rose-200">
                {error}
              </div>
            )}

            <JobCreateForm onSubmit={handleSubmit} loading={loading} />
          </div>
        </section>
      </main>
    </div>
  );
}
