import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./client";

export type DegreePlanTerm = {
  term_id: string;
  course_codes: string[];
  total_credits: number;
};

export type DegreePlanObjective = {
  status: string;
  max_term_used_index: number | null;
};

export type DegreePlanResponse = {
  terms: DegreePlanTerm[];
  objective: DegreePlanObjective;
  warnings: string[];
};

export type DegreePlanRequest = {
  program_id: string;
  completed_courses: string[];
  target_grad_term: string | null;
  allowed_terms: string[];
  min_credits_per_term: number;
  max_credits_per_term: number;
  max_terms: number | null;
};

async function planDegree(request: DegreePlanRequest): Promise<DegreePlanResponse> {
  const response = await apiClient.post<DegreePlanResponse>("/plan/degree/", request);
  return response.data;
}

export function useDegreePlan() {
  return useMutation({
    mutationFn: planDegree
  });
}
