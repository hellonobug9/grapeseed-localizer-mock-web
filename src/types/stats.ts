import type { ProjectInfo } from "@/types/project";
import type { Language } from "@/types/language";

export type ProjectStats = {
  project: ProjectInfo;
  totalKeys: number;
  newKeys: number;
  untranslated: number;
  coverage: number;
  pendingTest: number;
  pendingLive: number;
  untranslatedKeys: number;
};

export type LanguageStat = {
  language: Language;
  total: number;
  translated: number;
  missing: number;
  coverage: number;
  lastUpdated?: Date;
};

export type ModuleStat = {
  name: string;
  total: number;
  newCount: number;
  missing: number;
};
