"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { updateApplicationStatus } from "@/lib/api";
import { ApiRequestError } from "@/lib/apiErrors";
import type { ApplicationResponse, ApplicationWorkflowStatus } from "@/types/application";

export interface ApplicationRowProps {
  application: ApplicationResponse;
  allowedNextStatuses: string[];
  statusRulesLoading?: boolean;
  /** When true, workflow rules failed to load — hide the update form. */
  statusRulesFailed?: boolean;
  onApplicationUpdated?: (application: ApplicationResponse) => void;
}

function formatStatusLabel(value: string): string {
  const t = value.trim();
  if (!t) return value;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export default function ApplicationRow({
  application,
  allowedNextStatuses,
  statusRulesLoading = false,
  statusRulesFailed = false,
  onApplicationUpdated,
}: ApplicationRowProps) {
  const { id, job_id, applicant_name, email, years_experience, cv_summary, status, linkedin_url } = application;

  const [selectedNext, setSelectedNext] = useState("");
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedNext("");
    setNote("");
    setFormError(null);
  }, [status, id]);

  const canUpdate =
    Boolean(onApplicationUpdated) &&
    allowedNextStatuses.length > 0 &&
    !statusRulesLoading &&
    !statusRulesFailed;

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onApplicationUpdated) return;

    setFormError(null);
    const trimmedNote = note.trim();
    if (!selectedNext) {
      setFormError("Select the next status.");
      return;
    }
    if (!trimmedNote) {
      setFormError("A note is required for the status history log.");
      return;
    }

    setUpdating(true);
    try {
      const updated = await updateApplicationStatus(id, {
        status: selectedNext as ApplicationWorkflowStatus,
        note: trimmedNote,
      });
      onApplicationUpdated(updated);
      setSelectedNext("");
      setNote("");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Update failed.");
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <article className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{applicant_name}</h2>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <a
              href={`mailto:${email}`}
              className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-200"
            >
              {email}
            </a>
            <span className="mx-2 text-zinc-400">·</span>
            <span>{years_experience} years experience</span>
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Applied to{" "}
            <Link
              href={`/job/${job_id}`}
              className="font-semibold text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
            >
              Job #{job_id}
            </Link>
            <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-500">Application ID {id}</span>
          </p>
          {linkedin_url && (
            <p className="text-sm">
              <a
                href={linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-900 underline-offset-2 hover:underline dark:text-white"
              >
                LinkedIn profile
              </a>
            </p>
          )}
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{cv_summary}</p>
        </div>

        {onApplicationUpdated && (
          <div className="w-full shrink-0 border-t border-zinc-200 pt-6 dark:border-zinc-800 lg:w-80 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Update status
            </h3>
            {statusRulesLoading ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Loading allowed moves…</p>
            ) : statusRulesFailed ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Status updates are unavailable until workflow rules load successfully.
              </p>
            ) : !canUpdate ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                No further status changes are allowed for this application.
              </p>
            ) : (
              <form onSubmit={handleStatusSubmit} className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor={`next-status-${id}`} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Next status
                  </label>
                  <select
                    id={`next-status-${id}`}
                    value={selectedNext}
                    onChange={(e) => setSelectedNext(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
                  >
                    <option value="">Select…</option>
                    {allowedNextStatuses.map((s) => (
                      <option key={s} value={s}>
                        {formatStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`status-note-${id}`} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Note (required)
                  </label>
                  <textarea
                    id={`status-note-${id}`}
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Phone screen completed — moving to shortlist."
                    className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
                  />
                </div>
                {formError && (
                  <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
                    {formError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200"
                >
                  {updating ? "Saving…" : "Save status"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
