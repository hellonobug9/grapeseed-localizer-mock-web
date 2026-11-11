import type { LockFilterId } from "@/constants/lock";
import type { LockInfo } from "@/types/lock";
import type { PublishInfo } from "@/types/publish";

export type ProjectInfo = {
  id: number;
  name: string;
  description: string;
  languages: string[];
  modules: string[];
  moduleLabelKeys?: Record<string, string>;
  lastTranslatedAt: Date;
  lastTranslatedBy: string;
  test: PublishInfo;
  live: PublishInfo;
  lock?: LockInfo;
  newKeyCount: number;
  missingRate: number;
};

export type ProjectLockState = "Open" | "Locked" | "Scheduled";

export type ProjectListItem = {
  id: number;
  name: string;
  targetLanguageCodes: string[];
  totalKeys: number;
  untranslatedKeyCount: number;
  untranslatedStringCount: number;
  lastTranslatedAt: string | null;
  lastTranslatedBy: string | null;
  lockState: ProjectLockState;
  lockStartAt?: string | null;
  lockEndAt?: string | null;
  lockedBy?: string | null;
};

export type ProjectListQuery = {
  filter?: LockFilterId;
  search?: string;
};

export type ProjectsSummary = {
  projectCount: number;
  keyCount: number;
  statusCounts: {
    open: number;
    locked: number;
  };
};

export type ProjectLanguageProgress = {
  code: string;
  untranslatedCount: number;
  lastTranslatedAt: string | null;
};

export type CreateProjectRequest = {
  name: string;
  languageCodes: string[];
};

export type CreateProjectResponse = {
  id: number;
};
