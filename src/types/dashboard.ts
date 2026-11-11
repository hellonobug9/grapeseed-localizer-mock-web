export type DashboardLockedProject = {
  id: number;
  name: string;
  lockStartAt: string;
  lockEndAt: string | null;
  lockedBy: string;
};

export type DashboardLanguage = {
  code: string;
  name: string;
  totalKeys: number;
  untranslatedCount: number;
};

export type DashboardAttentionProject = {
  id: number;
  name: string;
  untranslatedStringCount: number;
  lastTranslatedAt: string | null;
};

export type Dashboard = {
  projectCount: number;
  languageCount: number;
  totalKeys: number;
  newKeyCount: number;
  newKeyCountPrevious: number;
  lockedProjects: DashboardLockedProject[];
  languages: DashboardLanguage[];
  needsAttention: DashboardAttentionProject[];
};
