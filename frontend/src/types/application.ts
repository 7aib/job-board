export interface ApplicationCreateRequest {
  applicant_name: string;
  email: string;
  years_experience: number;
  cv_summary: string;
  linkedin_url?: string | null;
}

export interface ApplicationResponse {
  id: number;
  job_id: number;
  applicant_name: string;
  email: string;
  years_experience: number;
  cv_summary: string;
  linkedin_url: string | null;
  status: "pending" | "shortlisted" | "offered" | "rejected";
}

export interface BrowseApplicationsResponse {
  total_count: number;
  page: number;
  per_page: number;
  results: ApplicationResponse[];
}

export type ApplicationWorkflowStatus = ApplicationResponse["status"];

export interface ApplicationStatusUpdateRequest {
  status: ApplicationWorkflowStatus;
  note: string;
}
