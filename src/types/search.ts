import type { SearchScopeId } from "@/constants/search";

export type SearchQuery = {
  q: string;
  scope?: SearchScopeId;
  projectId?: number;
  languageCode?: string;
  page?: number;
  pageSize?: number;
};

export type SearchText = {
  languageCode: string;
  text: string;
};

export type SearchResultItem = {
  key: {
    id: number;
    key: string;
    isNew: boolean;
  };
  project: {
    id: number;
    name: string;
    code: string;
  };
  keyMatched: boolean;
  texts: SearchText[];
};

export type SearchResponse = {
  items: SearchResultItem[];
  total: number;
  page: number;
};
