import { useState } from "react";
import type { JobCreateRequest } from "@/types/job";

interface JobCreateFormProps {
  onSubmit: (jobData: JobCreateRequest) => Promise<void>;
  loading: boolean;
}

export default function JobCreateForm({ onSubmit, loading }: JobCreateFormProps) {
  const [formData, setFormData] = useState<JobCreateRequest>({
    title: "",
    department: "",
    description: "",
    location: "remote",
    salary_min: 0,
    salary_max: 0,
    required_skills: [],
    max_applicants: null,
    deadline: "",
  });

  const [skillsInput, setSkillsInput] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setClientError(null);

    if (!formData.title.trim() || !formData.department.trim() || !formData.description.trim()) {
      setClientError("Please fill in all required fields (title, department, and description).");
      return;
    }

    if (formData.salary_min >= formData.salary_max) {
      setClientError("Minimum salary must be strictly less than maximum salary.");
      return;
    }

    if (formData.required_skills.length === 0) {
      setClientError("Please add at least one required skill.");
      return;
    }

    if (!formData.deadline) {
      setClientError("Please select an application deadline.");
      return;
    }

    await onSubmit(formData);
  };

  const handleChange = (field: keyof JobCreateRequest, value: string | number | null) => {
    setClientError(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    setClientError(null);
    const skill = skillsInput.trim();
    if (skill && !formData.required_skills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        required_skills: [...prev.required_skills, skill],
      }));
      setSkillsInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setClientError(null);
    setFormData((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSkillsKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {clientError && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/80 dark:text-rose-100"
        >
          {clientError}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Job Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
            placeholder="e.g. Senior Software Engineer"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="department" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Department *
          </label>
          <input
            id="department"
            type="text"
            required
            value={formData.department}
            onChange={(e) => handleChange("department", e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
            placeholder="e.g. Engineering"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Job Description *
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
          placeholder="Describe the role, responsibilities, and requirements..."
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="location" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Location *
          </label>
          <select
            id="location"
            value={formData.location}
            onChange={(e) => handleChange("location", e.target.value as JobCreateRequest["location"])}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="salary_min" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Min Salary *
          </label>
          <input
            id="salary_min"
            type="number"
            required
            min="0"
            value={formData.salary_min || ""}
            onChange={(e) => handleChange("salary_min", Number(e.target.value))}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
            placeholder="80000"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="salary_max" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Max Salary *
          </label>
          <input
            id="salary_max"
            type="number"
            required
            min="0"
            value={formData.salary_max || ""}
            onChange={(e) => handleChange("salary_max", Number(e.target.value))}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
            placeholder="120000"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="deadline" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Application Deadline *
          </label>
          <input
            id="deadline"
            type="date"
            required
            value={formData.deadline}
            onChange={(e) => handleChange("deadline", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="max_applicants" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Max Applicants
          </label>
          <input
            id="max_applicants"
            type="number"
            min="1"
            value={formData.max_applicants || ""}
            onChange={(e) => handleChange("max_applicants", e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Required Skills *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            onKeyPress={handleSkillsKeyPress}
            className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10"
            placeholder="e.g. Python, React, SQL"
          />
          <button
            type="button"
            onClick={addSkill}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200"
          >
            Add
          </button>
        </div>
        {formData.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.required_skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200"
        >
          {loading ? "Creating..." : "Create Job"}
        </button>
      </div>
    </form>
  );
}
