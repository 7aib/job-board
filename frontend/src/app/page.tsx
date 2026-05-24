"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApplicationRow, FilterBar, JobAnalyticsStats, JobCard, PaginationControls } from "@/components";
import {
  fetchApplicationStatusTransitions,
  fetchApplications,
  fetchJobs,
  fetchStats,
} from "@/lib/api";
import type { ApplicationResponse } from "@/types/application";
import type { StatsResponse } from "@/types/stats";
import type { JobResponse } from "@/types/job";

const JOBS_PER_PAGE = 6;
const APPLICATIONS_PER_PAGE = 10;

type HomeTab = "jobs" | "applications" | "analytics";

const TAB_INTRO: Record<HomeTab, string> = {
  jobs: "Jobs are loaded from `/api/jobs` with filters and pagination.",
  applications:
    "Applications are loaded from `/api/applications` with pagination. Update pipeline status from each row when rules load.",
  analytics:
    "Live platform metrics from `GET /api/stats`: listings, application volume, averages, and the busiest department by application count.",
};

function getStatus(isClosed: boolean, deadline: string) {
  const deadlineDate = new Date(deadline);
  const isExpired = deadlineDate < new Date();
  return isClosed || isExpired ? "Closed" : "Open";
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<HomeTab>("jobs");

  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [appPage, setAppPage] = useState(1);
  const [appTotalPages, setAppTotalPages] = useState(1);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [statusTransitions, setStatusTransitions] = useState<Record<string, string[]>>({});
  const [transitionsLoading, setTransitionsLoading] = useState(false);
  const [transitionsError, setTransitionsError] = useState<string | null>(null);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "jobs") return;

    let isMounted = true;

    async function loadJobs() {
      setJobsLoading(true);
      setJobsError(null);

      try {
        const data = await fetchJobs(currentPage, JOBS_PER_PAGE, false, departmentFilter, locationFilter);
        if (!isMounted) return;

        setJobs(data.results);
        setDepartments(Array.from(new Set(data.results.map((job) => job.department))).sort());
        setLocations(Array.from(new Set(data.results.map((job) => job.location))).sort());
        setTotalPages(Math.max(1, Math.ceil(data.total_count / data.per_page)));
      } catch (err) {
        if (!isMounted) return;
        setJobsError(err instanceof Error ? err.message : "Unable to load jobs.");
      } finally {
        if (isMounted) setJobsLoading(false);
      }
    }

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, [activeTab, currentPage, departmentFilter, locationFilter]);

  useEffect(() => {
    if (activeTab !== "applications") return;

    let isMounted = true;

    async function loadApplications() {
      setAppsLoading(true);
      setAppsError(null);

      try {
        const data = await fetchApplications(appPage, APPLICATIONS_PER_PAGE);
        if (!isMounted) return;

        setApplications(data.results);
        setAppTotalPages(Math.max(1, Math.ceil(data.total_count / data.per_page)));
      } catch (err) {
        if (!isMounted) return;
        setAppsError(err instanceof Error ? err.message : "Unable to load applications.");
      } finally {
        if (isMounted) setAppsLoading(false);
      }
    }

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, [activeTab, appPage]);

  useEffect(() => {
    if (activeTab !== "applications") return;

    let isMounted = true;
    setTransitionsLoading(true);
    setTransitionsError(null);

    fetchApplicationStatusTransitions()
      .then((map) => {
        if (isMounted) setStatusTransitions(map);
      })
      .catch((err) => {
        if (isMounted) {
          setTransitionsError(err instanceof Error ? err.message : "Failed to load status rules.");
        }
      })
      .finally(() => {
        if (isMounted) setTransitionsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "analytics") return;

    let isMounted = true;
    setStatsLoading(true);
    setStatsError(null);

    fetchStats()
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch((err) => {
        if (isMounted) {
          setStatsError(err instanceof Error ? err.message : "Unable to load analytics.");
        }
      })
      .finally(() => {
        if (isMounted) setStatsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  function refreshStats() {
    setStatsRefreshing(true);
    setStatsError(null);
    fetchStats()
      .then(setStats)
      .catch((err) => {
        setStatsError(err instanceof Error ? err.message : "Unable to load analytics.");
      })
      .finally(() => setStatsRefreshing(false));
  }

  function handleApplicationUpdated(updated: ApplicationResponse) {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  function resetFilters() {
    setDepartmentFilter("");
    setLocationFilter("");
    setCurrentPage(1);
  }

  const tabButtonClass = (tab: HomeTab) =>
    [
      "inline-flex h-10 flex-1 items-center justify-center rounded-xl px-3 text-sm font-semibold transition sm:flex-none sm:px-5",
      activeTab === tab
        ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
    ].join(" ");

  return (
    <div className="min-h-screen bg-zinc-50 py-10 text-slate-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-white/90 p-8 shadow-sm shadow-zinc-200/50 dark:bg-zinc-950/80 dark:shadow-black/20">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                  Live API job board
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Browse jobs from the backend
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">{TAB_INTRO[activeTab]}</p>
              </div>
              <Link
                href="/job/create"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200"
              >
                Create Job
              </Link>
            </div>

            <div
              role="tablist"
              aria-label="Home sections"
              className="flex w-full max-w-2xl flex-wrap gap-1 rounded-2xl border border-zinc-200 bg-zinc-100/90 p-1 dark:border-zinc-700 dark:bg-zinc-900/60"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "jobs"}
                className={tabButtonClass("jobs")}
                onClick={() => setActiveTab("jobs")}
              >
                Jobs
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "applications"}
                className={tabButtonClass("applications")}
                onClick={() => setActiveTab("applications")}
              >
                Applications
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "analytics"}
                className={tabButtonClass("analytics")}
                onClick={() => setActiveTab("analytics")}
              >
                Analytics
              </button>
            </div>
          </div>
        </section>

        {activeTab === "jobs" && (
          <FilterBar
            department={departmentFilter}
            location={locationFilter}
            departments={departments}
            locations={locations}
            onDepartmentChange={(value) => {
              setDepartmentFilter(value);
              setCurrentPage(1);
            }}
            onLocationChange={(value) => {
              setLocationFilter(value);
              setCurrentPage(1);
            }}
            onReset={resetFilters}
          />
        )}

        {activeTab === "jobs" && (
          <section className="space-y-6">
            {jobsLoading ? (
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/90 p-10 text-center text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-slate-300">
                Loading jobs...
              </div>
            ) : jobsError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/80 dark:text-rose-200">
                {jobsError}
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-3xl border border-zinc-200 bg-white/90 p-10 text-center text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-slate-300">
                No jobs found.
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    jobId={job.id}
                    title={job.title}
                    department={job.department}
                    location={job.location}
                    salaryRange={`$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`}
                    description={job.description}
                    status={getStatus(job.is_closed, job.deadline)}
                    deadline={job.deadline}
                    maxApplicants={job.max_applicants}
                    requiredSkills={job.required_skills}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "applications" && (
          <section className="space-y-6">
            {appsLoading ? (
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/90 p-10 text-center text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-slate-300">
                Loading applications...
              </div>
            ) : appsError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/80 dark:text-rose-200">
                {appsError}
              </div>
            ) : applications.length === 0 ? (
              <div className="rounded-3xl border border-zinc-200 bg-white/90 p-10 text-center text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-slate-300">
                No applications yet.
              </div>
            ) : (
              <>
                {transitionsError && !transitionsLoading && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
                  >
                    Could not load status workflow rules: {transitionsError}
                  </div>
                )}
                <div className="grid gap-4">
                  {applications.map((app) => (
                    <ApplicationRow
                      key={app.id}
                      application={app}
                      allowedNextStatuses={statusTransitions[app.status] ?? []}
                      statusRulesLoading={transitionsLoading}
                      statusRulesFailed={Boolean(transitionsError)}
                      onApplicationUpdated={handleApplicationUpdated}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "analytics" && (
          <JobAnalyticsStats
            stats={stats}
            statsLoading={statsLoading}
            statsRefreshing={statsRefreshing}
            error={statsError}
            onRefresh={refreshStats}
          />
        )}

        {activeTab === "jobs" && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            className="justify-center"
          />
        )}

        {activeTab === "applications" && (
          <PaginationControls
            currentPage={appPage}
            totalPages={appTotalPages}
            onPageChange={(page) => setAppPage(page)}
            className="justify-center"
          />
        )}
      </main>
    </div>
  );
}
