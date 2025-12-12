import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./client";

export type TimetableSection = {
  section_id: string;
  course_code: string;
  kind: string;
  day_of_week: string;
  start_time_minutes: number;
  end_time_minutes: number;
};

export type TimetableObjective = {
  status: string;
  total_penalty: number | null;
};

export type TimetableResponse = {
  sections: TimetableSection[];
  objective: TimetableObjective;
  warnings: string[];
};

export type TimetablePreferences = {
  earliest_time_minutes: number | null;
  latest_time_minutes: number | null;
  avoid_friday: boolean | null;
};

export type TimetableRequest = {
  term_id: string;
  course_codes: string[];
  preferences: TimetablePreferences;
};

async function planTimetable(request: TimetableRequest): Promise<TimetableResponse> {
  const response = await apiClient.post<TimetableResponse>("/plan/timetable/", request);
  return response.data;
}

export function useTimetablePlan() {
  return useMutation({
    mutationFn: planTimetable
  });
}
