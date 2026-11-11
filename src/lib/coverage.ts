import type { LanguageOverviewItem } from "@/types/language";
import type { ProjectListItem } from "@/types/project";

export type CoverageTone = "bad" | "warn" | "good";

export function coverageTone(value: number): CoverageTone {
  if (value < 30) return "bad";
  if (value <= 70) return "warn";
  return "good";
}

export function projectStringCount({ totalKeys, targetLanguageCodes }: ProjectListItem) {
  return totalKeys * targetLanguageCodes.length;
}

export function coverage(translated: number, total: number) {
  return total === 0 ? 100 : (translated * 100) / total;
}

export function projectCoverage(project: ProjectListItem) {
  const total = projectStringCount(project);
  return coverage(total - project.untranslatedStringCount, total);
}

export function languageTranslatedCount({ totalKeys, untranslatedCount }: LanguageOverviewItem) {
  return totalKeys - untranslatedCount;
}
