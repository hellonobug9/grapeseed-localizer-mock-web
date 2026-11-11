// In-memory stand-in for the Localizer API. This build has no backend, so
// useLocalizerApi routes every request here. Responses follow the shapes in
// src/types and are derived from data/mock_data, so the screens that still read
// mock data directly stay consistent with the ones that go through the API.
// Writes change the mock arrays in place and last until the page is reloaded.
import { SOURCE_LANGUAGE } from "@/constants/language";
import { LockFilterId, LockStatus } from "@/constants/lock";
import { UserRole } from "@/constants/role";
import { SearchScopeId } from "@/constants/search";
import { USER_STATUS_BY_ID, type UserStatusId } from "@/constants/user";
import {
  CURRENT_USER,
  KEYS,
  LANGUAGES,
  PROJECTS,
  USERS,
  getProject,
  isMissing,
  isNewKey,
} from "@/data/mock_data";
import { keysOf, targetLanguagesOf } from "@/data/stats";
import { LocalizerApiError } from "@/lib/api_error";
import { addDays, now } from "@/lib/dates";
import { lockStatus } from "@/lib/lock";
import { slugify } from "@/lib/slug";
import type { Dashboard } from "@/types/dashboard";
import type {
  CreateLanguageRequest,
  Language,
  LanguageOverviewItemResponse,
  LanguageProjectProgress,
  UpdateLanguageRequest,
} from "@/types/language";
import type { LockInfo } from "@/types/lock";
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectInfo,
  ProjectLanguageProgress,
  ProjectListItem,
  ProjectLockState,
  ProjectsSummary,
} from "@/types/project";
import type { SearchResponse, SearchResultItem } from "@/types/search";
import type { TranslationKey } from "@/types/translation_key";
import type { UserStatus } from "@/types/user";

export type MockRequest = {
  method: string;
  path: string;
  queryParams?: Record<string, unknown>;
  body?: unknown;
};

const NEEDS_ATTENTION_LIMIT = 4;
const DEFAULT_PAGE_SIZE = 20;
const NEW_KEY_WINDOW_DAYS = 7;

const LOCK_STATE: Record<LockStatus, ProjectLockState> = {
  [LockStatus.Open]: "Open",
  [LockStatus.Locked]: "Locked",
  [LockStatus.Scheduled]: "Scheduled",
};

const STATUS_ID = Object.fromEntries(
  Object.entries(USER_STATUS_BY_ID).map(([id, status]) => [status, Number(id)]),
) as Record<UserStatus, UserStatusId>;

const iso = (date: Date | null | undefined) => (date ? date.toISOString() : null);

const latest = (dates: Date[]) =>
  dates.reduce<Date | null>((max, d) => (!max || d > max ? d : max), null);

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

const conflict = (field: string, message: string) =>
  new LocalizerApiError(409, { description: message, details: { [field]: [message] } });

const notFound = (what: string) =>
  new LocalizerApiError(404, { description: `${what} not found.` });

// ---------- Projects ----------

const lockOf = (project: ProjectInfo) => lockStatus(project.lock, new Date());

const lastTranslatedIn = (keys: TranslationKey[], language: string) =>
  latest(keys.filter((k) => !isMissing(k, language)).map((k) => k.updatedAt));

const untranslatedIn = (keys: TranslationKey[], language: string) =>
  keys.filter((k) => isMissing(k, language)).length;

function toListItem(project: ProjectInfo): ProjectListItem {
  const keys = keysOf(project.id);
  const targets = targetLanguagesOf(project);
  const translated = keys.length > 0;
  return {
    id: project.id,
    name: project.name,
    targetLanguageCodes: targets,
    totalKeys: keys.length,
    untranslatedKeyCount: keys.filter((k) => targets.some((l) => isMissing(k, l))).length,
    untranslatedStringCount: targets.reduce((sum, l) => sum + untranslatedIn(keys, l), 0),
    lastTranslatedAt: translated ? iso(project.lastTranslatedAt) : null,
    lastTranslatedBy: translated ? project.lastTranslatedBy : null,
    lockState: LOCK_STATE[lockOf(project)],
    lockStartAt: iso(project.lock?.startAt),
    lockEndAt: iso(project.lock?.endAt),
    lockedBy: project.lock?.lockedBy ?? null,
  };
}

function listProjects(query: Record<string, unknown> = {}): ProjectListItem[] {
  const search = String(query.search ?? "")
    .trim()
    .toLowerCase();
  const filter = Number(query.filter ?? LockFilterId.all);
  return PROJECTS.map(toListItem)
    .filter((p) => !search || p.name.toLowerCase().includes(search))
    .filter((p) => {
      if (filter === LockFilterId.locked) return p.lockState === "Locked";
      if (filter === LockFilterId.open) return p.lockState !== "Locked";
      return true;
    })
    .toSorted(byName);
}

function projectsSummary(): ProjectsSummary {
  const items = PROJECTS.map(toListItem);
  const locked = items.filter((p) => p.lockState === "Locked").length;
  return {
    projectCount: items.length,
    keyCount: items.reduce((sum, p) => sum + p.totalKeys, 0),
    statusCounts: { open: items.length - locked, locked },
  };
}

function projectLanguages(projectId: number): ProjectLanguageProgress[] {
  const project = getProject(projectId);
  if (!project) throw notFound("Project");
  const keys = keysOf(project.id);
  return targetLanguagesOf(project).map((code) => ({
    code,
    untranslatedCount: untranslatedIn(keys, code),
    lastTranslatedAt: iso(lastTranslatedIn(keys, code)),
  }));
}

function createProject(body: CreateProjectRequest): CreateProjectResponse {
  const name = body.name.trim();
  if (PROJECTS.some((p) => p.name.toLowerCase() === name.toLowerCase()))
    throw conflict("Name", `A project named "${name}" already exists.`);
  const id = Math.max(...PROJECTS.map((p) => p.id)) + 1;
  const created = new Date();
  const publish = { publishedAt: created, publishedBy: CURRENT_USER.name };
  PROJECTS.push({
    id,
    name,
    description: "",
    languages: [SOURCE_LANGUAGE, ...body.languageCodes.filter((c) => c !== SOURCE_LANGUAGE)],
    modules: [],
    lastTranslatedAt: created,
    lastTranslatedBy: CURRENT_USER.name,
    test: publish,
    live: publish,
    newKeyCount: 0,
    missingRate: 0,
  });
  return { id };
}

// Lock actions still run on the client (state/lock_provider); they call this so
// the lists and the dashboard served from here see the same lock.
export function setMockProjectLock(projectId: number, lock: LockInfo | undefined) {
  const project = getProject(projectId);
  if (project) project.lock = lock;
}

// ---------- Languages ----------

const projectsWith = (code: string) => PROJECTS.filter((p) => p.languages.includes(code));

function listLanguages(): Language[] {
  return LANGUAGES.toSorted(byName);
}

function languagesOverview(): LanguageOverviewItemResponse[] {
  return LANGUAGES.map((language) => {
    const projects = projectsWith(language.code);
    const keys = projects.flatMap((p) => keysOf(p.id));
    const isSource = language.code === SOURCE_LANGUAGE;
    return {
      ...language,
      isSource,
      translators: USERS.filter(
        (u) => u.role === UserRole.Comtor && u.languages?.includes(language.code),
      ).map((u) => ({ id: u.id, name: u.name, email: u.email, status: STATUS_ID[u.status] })),
      projects: projects.map((p) => ({ id: p.id, name: p.name })).toSorted(byName),
      totalKeys: keys.length,
      untranslatedCount: untranslatedIn(keys, language.code),
      lastTranslatedAt: isSource ? null : iso(lastTranslatedIn(keys, language.code)),
    };
  }).toSorted((a, b) => Number(b.isSource) - Number(a.isSource) || byName(a, b));
}

function languageProjects(code: string): LanguageProjectProgress[] {
  return projectsWith(code).map((project) => {
    const keys = keysOf(project.id);
    return {
      id: project.id,
      lock: project.lock
        ? { startAt: project.lock.startAt.toISOString(), endAt: iso(project.lock.endAt) }
        : null,
      totalKeys: keys.length,
      untranslatedCount: untranslatedIn(keys, code),
      lastTranslatedAt: iso(lastTranslatedIn(keys, code)),
    };
  });
}

const findLanguage = (code: string) =>
  LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());

function createLanguage(body: CreateLanguageRequest) {
  const code = body.code.trim();
  if (findLanguage(code)) throw conflict("Code", `The language code "${code}" already exists.`);
  LANGUAGES.push({ code, name: body.name.trim(), nativeName: body.nativeName.trim() });
}

function updateLanguage(code: string, body: UpdateLanguageRequest) {
  const language = findLanguage(code);
  if (!language) throw notFound("Language");
  language.name = body.name.trim();
  language.nativeName = body.nativeName.trim();
}

function deleteLanguage(code: string) {
  const language = findLanguage(code);
  if (!language) throw notFound("Language");
  if (language.code === SOURCE_LANGUAGE)
    throw new LocalizerApiError(409, { description: "The source language can't be deleted." });
  LANGUAGES.splice(LANGUAGES.indexOf(language), 1);
  for (const project of PROJECTS)
    project.languages = project.languages.filter((l) => l !== language.code);
  for (const user of USERS)
    if (user.languages) user.languages = user.languages.filter((l) => l !== language.code);
}

// ---------- Dashboard ----------

function dashboard(): Dashboard {
  const projects = PROJECTS.map(toListItem);
  const newSince = addDays(now, -NEW_KEY_WINDOW_DAYS);
  const previousSince = addDays(now, -2 * NEW_KEY_WINDOW_DAYS);
  const targets = LANGUAGES.filter((l) => l.code !== SOURCE_LANGUAGE);

  return {
    projectCount: projects.length,
    languageCount: targets.length,
    totalKeys: KEYS.length,
    newKeyCount: KEYS.filter(isNewKey).length,
    newKeyCountPrevious: KEYS.filter((k) => k.createdAt >= previousSince && k.createdAt < newSince)
      .length,
    lockedProjects: PROJECTS.filter((p) => p.lock && lockOf(p) !== LockStatus.Open).map((p) => ({
      id: p.id,
      name: p.name,
      lockStartAt: p.lock!.startAt.toISOString(),
      lockEndAt: iso(p.lock!.endAt),
      lockedBy: p.lock!.lockedBy,
    })),
    languages: targets
      .map((language) => {
        const keys = projectsWith(language.code).flatMap((p) => keysOf(p.id));
        return {
          code: language.code,
          name: language.name,
          totalKeys: keys.length,
          untranslatedCount: untranslatedIn(keys, language.code),
        };
      })
      .filter((l) => l.totalKeys > 0)
      .toSorted((a, b) => b.untranslatedCount - a.untranslatedCount),
    needsAttention: projects
      .filter((p) => p.untranslatedStringCount > 0)
      .toSorted((a, b) => b.untranslatedStringCount - a.untranslatedStringCount)
      .slice(0, NEEDS_ATTENTION_LIMIT)
      .map((p) => ({
        id: p.id,
        name: p.name,
        untranslatedStringCount: p.untranslatedStringCount,
        lastTranslatedAt: p.lastTranslatedAt,
      })),
  };
}

// ---------- Search ----------

function search(query: Record<string, unknown>): SearchResponse {
  const q = String(query.q ?? "")
    .trim()
    .toLowerCase();
  const scope = Number(query.scope ?? SearchScopeId.all);
  const projectId = query.projectId ? Number(query.projectId) : undefined;
  const languageCode = query.languageCode ? String(query.languageCode) : undefined;
  const pageSize = Number(query.pageSize ?? DEFAULT_PAGE_SIZE);
  const matchKey = scope !== SearchScopeId.text;
  const matchText = scope !== SearchScopeId.key;

  const matches: SearchResultItem[] = [];
  for (const key of KEYS) {
    const project = getProject(key.projectId);
    if (!project || (projectId && project.id !== projectId)) continue;
    if (languageCode && !project.languages.includes(languageCode)) continue;
    const languages = languageCode ? [languageCode] : project.languages;
    const keyMatched = matchKey && key.key.toLowerCase().includes(q);
    const textHits = matchText
      ? languages.filter((l) => key.values[l]?.toLowerCase().includes(q))
      : [];
    if (!keyMatched && textHits.length === 0) continue;
    // A key-only match shows the text it would be edited from, for context.
    const shown = textHits.length > 0 ? textHits : [languageCode ?? SOURCE_LANGUAGE];
    matches.push({
      key: { id: key.id, key: key.key, isNew: isNewKey(key) },
      project: { id: project.id, name: project.name, code: slugify(project.name) },
      keyMatched,
      texts: shown
        .filter((l) => key.values[l])
        .map((l) => ({ languageCode: l, text: key.values[l]! })),
    });
  }

  const ranked = matches.toSorted((a, b) => Number(b.keyMatched) - Number(a.keyMatched));
  const pageCount = Math.max(1, Math.ceil(ranked.length / pageSize));
  const page = Math.min(Math.max(1, Number(query.page ?? 1)), pageCount);
  return {
    items: ranked.slice((page - 1) * pageSize, page * pageSize),
    total: ranked.length,
    page,
  };
}

// ---------- Router ----------

type Handler = (req: MockRequest, params: string[]) => unknown;

const ROUTES: [method: string, pattern: RegExp, handler: Handler][] = [
  ["GET", /^dashboard$/, dashboard],
  ["GET", /^projects\/list$/, (req) => listProjects(req.queryParams)],
  ["GET", /^projects\/summary$/, projectsSummary],
  ["GET", /^projects\/(\d+)\/languages$/, (_, [id]) => projectLanguages(Number(id))],
  ["POST", /^projects$/, (req) => createProject(req.body as CreateProjectRequest)],
  ["GET", /^languages$/, listLanguages],
  ["GET", /^languages\/overview$/, languagesOverview],
  ["GET", /^languages\/([^/]+)\/projects$/, (_, [code]) => languageProjects(code)],
  ["POST", /^languages$/, (req) => createLanguage(req.body as CreateLanguageRequest)],
  [
    "PUT",
    /^languages\/([^/]+)$/,
    (req, [code]) => updateLanguage(code, req.body as UpdateLanguageRequest),
  ],
  ["DELETE", /^languages\/([^/]+)$/, (_, [code]) => deleteLanguage(code)],
  ["GET", /^search$/, (req) => search(req.queryParams ?? {})],
];

export function mockRequest(req: MockRequest): unknown {
  const method = req.method.toUpperCase();
  const path = req.path.replace(/^\/+|\/+$/g, "");
  for (const [routeMethod, pattern, handler] of ROUTES) {
    const match = routeMethod === method ? pattern.exec(path) : null;
    if (!match) continue;
    const result = handler(req, match.slice(1).map(decodeURIComponent));
    // Copy so cached query data never shares objects with the mock store.
    return result === undefined ? undefined : structuredClone(result);
  }
  throw new LocalizerApiError(404, {
    description: `The mock API has no handler for ${method} ${path}.`,
  });
}
