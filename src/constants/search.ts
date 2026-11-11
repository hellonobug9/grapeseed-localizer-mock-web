export const SearchScope = {
  All: "all",
  Key: "key",
  Text: "text",
} as const;

export type SearchScope = (typeof SearchScope)[keyof typeof SearchScope];

export const SEARCH_SCOPES = Object.values(SearchScope);

export const SEARCH_FILTER_ALL = "all";

export const MAX_LANGUAGE_MATCHES = 4;

export const SearchScopeId = {
  [SearchScope.All]: 0,
  [SearchScope.Key]: 1,
  [SearchScope.Text]: 2,
} as const satisfies Record<SearchScope, number>;

export type SearchScopeId = (typeof SearchScopeId)[SearchScope];
