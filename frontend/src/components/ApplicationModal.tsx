import { useEffect } from "react";
import JobApplicationForm from "./JobApplicationForm";
import type { ApplicationCreateRequest } from "@/types/application";

interface ApplicationModalProps {
  isOpen: boolean;
  jobId: number;
  jobTitle: string;
  onSubmit: (applicationData: ApplicationCreateRequest) => Promise<void>;
  loading: boolean;
  onClose: () => void;
}

export default function ApplicationModal({
  isOpen,
  jobId,
  jobTitle,
  onSubmit,
  loading,
  onClose,
}: ApplicationModalProps) {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-lg dark:bg-zinc-950">
        <div className="sticky top-0 border-b border-zinc-200 bg-white px-8 py-4 dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New Application</h1>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-8">
          <JobApplicationForm
            jobId={jobId}
            jobTitle={jobTitle}
            onSubmit={onSubmit}
            loading={loading}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
