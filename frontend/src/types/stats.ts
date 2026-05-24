/** Matches `GET /api/stats` (`StatsResponse` in the FastAPI backend). */
export interface StatsResponse {
  total_jobs: number;
  open_jobs: number;
  closed_jobs: number;
  total_applications: number;
  avg_applications_per_job: number;
  top_department: string | null;
}
