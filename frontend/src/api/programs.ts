import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";

export type Program = {
  id: string;
  name: string;
  description: string | null;
};

async function fetchPrograms(): Promise<Program[]> {
  const response = await apiClient.get<Program[]>("/programs/");
  return response.data;
}

export function usePrograms() {
  return useQuery({
    queryKey: ["programs"],
    queryFn: fetchPrograms
  });
}
