export interface JobResponse {
  id: number;
  title: string;
  department: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  required_skills: string[];
  max_applicants: number | null;
  deadline: string;
  is_closed: boolean;
}

export interface BrowseJobsResponse {
  total_count: number;
  page: number;
  per_page: number;
  results: JobResponse[];
}

export interface JobCreateRequest {
  title: string;
  department: string;
  description: string;
  location: "remote" | "hybrid" | "onsite";
  salary_min: number;
  salary_max: number;
  required_skills: string[];
  max_applicants?: number | null;
  deadline: string; // ISO date string
}

export interface JobUpdateRequest {
  title?: string;
  department?: string;
  description?: string;
  location?: "remote" | "hybrid" | "onsite";
  salary_min?: number;
  salary_max?: number;
  required_skills?: string[];
  max_applicants?: number | null;
  deadline?: string; // ISO date string
  is_closed?: boolean;
}
