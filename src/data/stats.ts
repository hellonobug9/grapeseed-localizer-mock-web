import { SOURCE_LANGUAGE } from "@/constants/language";
import { PROJECTS, KEYS, LANGUAGES, isMissing, isNewKey } from "@/data/mock_data";
import type { ProjectInfo } from "@/types/project";
import type { ProjectStats, LanguageStat } from "@/types/stats";
import type { TranslationKey } from "@/types/translation_key";

const keysByProject = new Map<number, TranslationKey[]>();
for (const key of KEYS) {
  const list = keysByProject.get(key.projectId) ?? [];
  list.push(key);
  keysByProject.set(key.projectId, list);
}

export const keysOf = (projectId: number) => keysByProject.get(projectId) ?? [];

export const targetLanguagesOf = (project: ProjectInfo) =>
  project.languages.filter((l) => l !== SOURCE_LANGUAGE);

const latest = (dates: Date[]) =>
  dates.length === 0 ? undefined : new Date(Math.max(...dates.map((d) => d.getTime())));

export const statsFor = (project: ProjectInfo): ProjectStats => {
  const keys = keysOf(project.id);
  const targets = targetLanguagesOf(project);
  const slots = keys.length * targets.length;
  const missing = keys.reduce((sum, k) => sum + targets.filter((l) => isMissing(k, l)).length, 0);
  const changedSince = (date: Date) =>
    keys.filter((k) => k.createdAt > date || k.updatedAt > date).length;
  return {
    project,
    totalKeys: keys.length,
    newKeys: keys.filter(isNewKey).length,
    untranslated: missing,
    coverage: slots === 0 ? 100 : ((slots - missing) * 100) / slots,
    pendingTest: changedSince(project.test.publishedAt),
    pendingLive: changedSince(project.live.publishedAt),
    untranslatedKeys: keys.filter((k) => targets.some((l) => isMissing(k, l))).length,
  };
};

export const ALL_PROJECT_STATS = PROJECTS.map(statsFor);

export const languageStatsFor = (projects: ProjectInfo[]): LanguageStat[] =>
  LANGUAGES.filter((l) => l.code !== SOURCE_LANGUAGE)
    .map((language) => {
      const keys = projects
        .filter((a) => a.languages.includes(language.code))
        .flatMap((a) => keysOf(a.id));
      const done = keys.filter((k) => !isMissing(k, language.code));
      return {
        language,
        total: keys.length,
        translated: done.length,
        missing: keys.length - done.length,
        coverage: keys.length === 0 ? 100 : (done.length * 100) / keys.length,
        lastUpdated: latest(done.map((k) => k.updatedAt)),
      };
    })
    .filter((s) => s.total > 0);
