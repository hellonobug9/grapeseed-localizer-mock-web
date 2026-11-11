import type { UserStatusId } from "@/constants/user";
import type { UserStatus } from "@/types/user";

export type Language = {
  code: string;
  name: string;
  nativeName: string;
};

export type CreateLanguageRequest = Language;

export type UpdateLanguageRequest = Omit<Language, "code">;

export type LanguageOverviewTranslator = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
};

export type LanguageOverviewProject = {
  id: number;
  name: string;
};

export type LanguageOverviewItem = Language & {
  isSource: boolean;
  translators: LanguageOverviewTranslator[];
  projects: LanguageOverviewProject[];
  totalKeys: number;
  untranslatedCount: number;
  lastTranslatedAt: string | null;
};

export type LanguageOverviewItemResponse = Omit<LanguageOverviewItem, "translators"> & {
  translators: (Omit<LanguageOverviewTranslator, "status"> & { status: UserStatusId })[];
};

export type LanguageProjectProgress = {
  id: number;
  lock: { startAt: string; endAt: string | null } | null;
  totalKeys: number;
  untranslatedCount: number;
  lastTranslatedAt: string | null;
};
