import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";

export type Course = {
  code: string;
  name: string;
  credits: number;
  description: string | null;
};

async function fetchCourses(): Promise<Course[]> {
  const response = await apiClient.get<Course[]>("/courses/");
  return response.data;
}

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses
  });
}
