import type { ProjectListQuery } from "@/types/project";
import type { SearchQuery } from "@/types/search";

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  languages: {
    all: ["languages"] as const,
    overview: ["languages", "overview"] as const,
    projects: (code: string) => ["languages", code, "projects"] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: (query: ProjectListQuery) => ["projects", "list", query] as const,
    summary: ["projects", "summary"] as const,
    languages: (id: number) => ["projects", id, "languages"] as const,
  },
  search: {
    list: (query: SearchQuery) => ["search", query] as const,
  },
};
