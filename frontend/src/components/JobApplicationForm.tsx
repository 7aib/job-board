import { useState } from "react";
import type { ApplicationCreateRequest } from "@/types/application";
import { ApiRequestError } from "@/lib/apiErrors";
import { applicationExistsForJob } from "@/lib/api";

interface JobApplicationFormProps {
  jobId: number;
  jobTitle: string;
  onSubmit: (applicationData: ApplicationCreateRequest) => Promise<void>;
  loading: boolean;
  onCancel: () => void;
}

type FieldKey = keyof ApplicationCreateRequest;

export default function JobApplicationForm({
  jobId,
  jobTitle,
  onSubmit,
  loading,
  onCancel,
}: JobApplicationFormProps) {
  const [formData, setFormData] = useState<ApplicationCreateRequest>({
    applicant_name: "",
    email: "",
    years_experience: 0,
    cv_summary: "",
    linkedin_url: null,
  });

  const [clientFieldErrors, setClientFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [apiFieldErrors, setApiFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);

  const clearErrors = () => {
    setClientFieldErrors({});
    setApiFieldErrors({});
    setServerMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearErrors();

    const nextClient: Partial<Record<FieldKey, string>> = {};

    if (!formData.applicant_name.trim()) {
      nextClient.applicant_name = "Please enter your full name.";
    }
    if (!formData.email.trim()) {
      nextClient.email = "Please enter your email address.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        nextClient.email = "Please enter a valid email address.";
      }
    }
    if (!formData.cv_summary.trim()) {
      nextClient.cv_summary = "Please provide a CV summary.";
    }
    if (formData.years_experience < 0) {
      nextClient.years_experience = "Years of experience cannot be negative.";
    }
    if (
      formData.linkedin_url &&
      !formData.linkedin_url.startsWith("https://linkedin.com/") &&
      !formData.linkedin_url.startsWith("https://www.linkedin.com/")
    ) {
      nextClient.linkedin_url =
        "LinkedIn URL must start with https://linkedin.com/ or https://www.linkedin.com/.";
    }

    if (Object.keys(nextClient).length > 0) {
      setClientFieldErrors(nextClient);
      return;
    }

    const emailNormalized = formData.email.trim().toLowerCase();
    setDuplicateCheckLoading(true);
    try {
      const alreadyApplied = await applicationExistsForJob(jobId, emailNormalized);
      if (alreadyApplied) {
        setClientFieldErrors({
          email:
            "This email has already been used to apply to this job. Each address can only apply once per listing.",
        });
        return;
      }
    } catch (err) {
      setServerMessage(
        err instanceof Error ? err.message : "Unable to verify whether this email has already applied."
      );
      return;
    } finally {
      setDuplicateCheckLoading(false);
    }

    const payload: ApplicationCreateRequest = {
      ...formData,
      applicant_name: formData.applicant_name.trim(),
      email: emailNormalized,
      cv_summary: formData.cv_summary.trim(),
      linkedin_url: formData.linkedin_url?.trim() || null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerMessage(err.message);
        setApiFieldErrors(err.fieldErrors);
      } else {
        setServerMessage(err instanceof Error ? err.message : "Failed to submit application.");
      }
    }
  };

  const handleChange = (field: FieldKey, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setClientFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setApiFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setServerMessage(null);
  };

  const fieldError = (field: FieldKey) => clientFieldErrors[field] ?? apiFieldErrors[field as string];

  const inputErrorClass = (field: FieldKey) =>
    fieldError(field)
      ? "border-rose-400 focus:border-rose-600 focus:ring-rose-200 dark:border-rose-600 dark:focus:border-rose-400 dark:focus:ring-rose-900/40"
      : "border-zinc-200 focus:border-slate-900 focus:ring-slate-200 dark:border-zinc-700 dark:focus:border-white dark:focus:ring-white/10";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Apply for: {jobTitle}
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Fill out the form below to submit your application
        </p>
      </div>

      {serverMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 whitespace-pre-wrap dark:border-rose-900/50 dark:bg-rose-950/80 dark:text-rose-100"
        >
          {serverMessage}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Full Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.applicant_name}
            onChange={(e) => handleChange("applicant_name", e.target.value)}
            className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition dark:bg-zinc-950 dark:text-zinc-100 ${inputErrorClass("applicant_name")}`}
            placeholder="e.g. John Doe"
            aria-invalid={!!fieldError("applicant_name")}
            aria-describedby={fieldError("applicant_name") ? "name-error" : undefined}
          />
          {fieldError("applicant_name") && (
            <p id="name-error" className="text-sm text-rose-600 dark:text-rose-400">
              {fieldError("applicant_name")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition dark:bg-zinc-950 dark:text-zinc-100 ${inputErrorClass("email")}`}
            placeholder="john@example.com"
            aria-invalid={!!fieldError("email")}
            aria-describedby={fieldError("email") ? "email-error" : undefined}
          />
          {fieldError("email") && (
            <p id="email-error" className="text-sm text-rose-600 dark:text-rose-400">
              {fieldError("email")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="experience" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Years of Experience *
        </label>
        <input
          id="experience"
          type="number"
          min="0"
          max="70"
          value={formData.years_experience}
          onChange={(e) => handleChange("years_experience", Number(e.target.value))}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition dark:bg-zinc-950 dark:text-zinc-100 ${inputErrorClass("years_experience")}`}
          placeholder="e.g. 5"
          aria-invalid={!!fieldError("years_experience")}
          aria-describedby={fieldError("years_experience") ? "experience-error" : undefined}
        />
        {fieldError("years_experience") && (
          <p id="experience-error" className="text-sm text-rose-600 dark:text-rose-400">
            {fieldError("years_experience")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="cv_summary" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          CV Summary *
        </label>
        <textarea
          id="cv_summary"
          rows={5}
          maxLength={1000}
          value={formData.cv_summary}
          onChange={(e) => handleChange("cv_summary", e.target.value)}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition dark:bg-zinc-950 dark:text-zinc-100 ${inputErrorClass("cv_summary")}`}
          placeholder="Provide a brief summary of your professional background, skills, and why you're interested in this position..."
          aria-invalid={!!fieldError("cv_summary")}
          aria-describedby={fieldError("cv_summary") ? "cv_summary-error" : undefined}
        />
        <div className="flex flex-wrap justify-between gap-2">
          {fieldError("cv_summary") ? (
            <p id="cv_summary-error" className="text-sm text-rose-600 dark:text-rose-400">
              {fieldError("cv_summary")}
            </p>
          ) : (
            <span />
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{formData.cv_summary.length} / 1000 characters</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="linkedin" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          LinkedIn Profile URL
        </label>
        <input
          id="linkedin"
          type="url"
          value={formData.linkedin_url || ""}
          onChange={(e) => handleChange("linkedin_url", e.target.value || null)}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition dark:bg-zinc-950 dark:text-zinc-100 ${inputErrorClass("linkedin_url")}`}
          placeholder="https://linkedin.com/in/yourprofile"
          aria-invalid={!!fieldError("linkedin_url")}
          aria-describedby={fieldError("linkedin_url") ? "linkedin-error" : undefined}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Optional. Must start with https://linkedin.com/ or https://www.linkedin.com/
        </p>
        {fieldError("linkedin_url") && (
          <p id="linkedin-error" className="text-sm text-rose-600 dark:text-rose-400">
            {fieldError("linkedin_url")}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || duplicateCheckLoading}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200"
        >
          {duplicateCheckLoading ? "Checking…" : loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}