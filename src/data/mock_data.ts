import { SOURCE_LANGUAGE } from "@/constants/language";
import { UserRole } from "@/constants/role";
import { CATALOG, CATALOG_LANGS, TERMS_EN, TERMS_VI } from "@/data/catalog";
import { TEMPLATES } from "@/data/templates";
import { addDays, addHours, addMinutes, hoursBetween, now, today } from "@/lib/dates";
import { formatDay } from "@/lib/format";
import { isLockedAt, lastLockedDay } from "@/lib/lock";
import { createRandom } from "@/lib/random";
import { isUntranslated } from "@/lib/translation";
import { isHtmlTemplate, TEMPLATE_TYPES } from "@/constants/template";
import type { ActivityItem } from "@/types/activity";
import type { ProjectInfo } from "@/types/project";
import type { Language } from "@/types/language";
import type { PublishRecord } from "@/types/publish";
import type { TranslationKey } from "@/types/translation_key";
import type { User } from "@/types/user";

export const CURRENT_USER = { name: "Logan Le", role: UserRole.Developer };
export const TEMPLATE_PROJECT_ID = 14;

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
];

export const TARGET_LANGUAGES = LANGUAGES.filter((l) => l.code !== SOURCE_LANGUAGE);

export const getLanguage = (code: string) => LANGUAGES.find((l) => l.code === code)!;

const ALL_LANGS = [...CATALOG_LANGS];

const LONG_PRIVACY_EN = [
  "<article>",
  "<h1>Privacy Notice</h1>",
  "<p>This extended document is mock content for testing long HTML translations in the editor.</p>",
  ...Array.from(
    { length: 12 },
    (_, index) => `<section>
  <h2>${index + 1}. ${["Information we collect", "How we use information", "Sharing and disclosure"][index % 3]}</h2>
  <p>We process account details, service activity, and preferences to provide a reliable experience. This paragraph intentionally contains enough content to exercise long-document scrolling, wrapping, and preview behavior.</p>
  <ul>
    <li>Keep your account secure and maintain the service.</li>
    <li>Improve features using aggregated product information.</li>
    <li>Contact us when we need to explain an important change.</li>
  </ul>
  <p>For more detail, visit our <a href="https://nexus.example/privacy#section-${index + 1}">privacy centre</a>.</p>
</section>`,
  ),
  '<p>Questions about this notice? Email <a href="mailto:privacy@nexus.example">privacy@nexus.example</a>.</p>',
  "</article>",
].join("\n");

const LONG_PRIVACY_VI = [
  "<article>",
  "<h1>Thông báo quyền riêng tư</h1>",
  "<p>Đây là nội dung giả lập để kiểm tra bản dịch HTML có độ dài lớn trong trình biên tập.</p>",
  ...Array.from(
    { length: 12 },
    (_, index) => `<section>
  <h2>${index + 1}. ${["Thông tin chúng tôi thu thập", "Cách chúng tôi sử dụng thông tin", "Chia sẻ và tiết lộ"][index % 3]}</h2>
  <p>Chúng tôi xử lý thông tin tài khoản, hoạt động sử dụng dịch vụ và các lựa chọn ưu tiên để cung cấp trải nghiệm đáng tin cậy. Đoạn văn này cố ý có độ dài lớn để kiểm tra việc cuộn, xuống dòng và xem trước tài liệu.</p>
  <ul>
    <li>Giữ an toàn cho tài khoản và duy trì dịch vụ.</li>
    <li>Cải thiện tính năng bằng thông tin sản phẩm đã được tổng hợp.</li>
    <li>Liên hệ khi cần giải thích một thay đổi quan trọng.</li>
  </ul>
  <p>Xem thêm tại <a href="https://nexus.example/privacy#section-${index + 1}">trung tâm quyền riêng tư</a>.</p>
</section>`,
  ),
  '<p>Nếu có câu hỏi, hãy gửi email tới <a href="mailto:privacy@nexus.example">privacy@nexus.example</a>.</p>',
  "</article>",
].join("\n");

const PEOPLE = [
  "Logan Le",
  "Mai Nguyen",
  "Kenji Sato",
  "Ji-woo Park",
  "Linh Tran",
  "Somchai K.",
  "Claire Martin",
  "Jonas Weber",
  "Lucia Gomez",
  "Putri Ayu",
  "Huy Pham",
  "Anh Vo",
];

const publish = (publishedAt: Date, publishedBy: string) => ({ publishedAt, publishedBy });

const TEMPLATE_PROJECT_LANGUAGES = [
  SOURCE_LANGUAGE,
  ...new Set(TEMPLATES.flatMap((template) => template.contents.map((content) => content.language))),
];
const latestTemplateContent = [...TEMPLATES.flatMap((template) => template.contents)].toSorted(
  (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
)[0];

export const PROJECTS: ProjectInfo[] = [
  {
    id: 1,
    name: "School site",
    description: "School administration portal for classes, students and staff.",
    languages: ALL_LANGS,
    modules: ["auth", "dashboard", "classes", "students", "attendance", "settings"],
    newKeyCount: 14,
    missingRate: 0.4,
    lastTranslatedAt: addHours(now, -2),
    lastTranslatedBy: "Mai Nguyen",
    test: publish(addHours(now, -20), "Logan Le"),
    live: publish(addDays(now, -6), "Huy Pham"),
  },
  {
    id: 2,
    name: "Parent site",
    description: "Parent portal to follow children's progress, messages and fees.",
    languages: ["en", "vi", "th", "id", "ja", "ko"],
    modules: ["auth", "home", "children", "messages", "payments", "profile"],
    newKeyCount: 9,
    missingRate: 0.08,
    lastTranslatedAt: addHours(addDays(now, -1), -3),
    lastTranslatedBy: "Somchai K.",
    test: publish(addDays(now, -2), "Anh Vo"),
    live: publish(addDays(now, -9), "Huy Pham"),
  },
  {
    id: 3,
    name: "Report site",
    description: "Academic and operational reports for schools and districts.",
    languages: ALL_LANGS,
    modules: ["auth", "dashboard", "reports", "filters", "export", "settings"],
    newKeyCount: 21,
    missingRate: 0.012,
    lastTranslatedAt: addDays(now, -3),
    lastTranslatedBy: "Claire Martin",
    lock: { lockedBy: "Logan Le", startAt: addDays(today, 4), endAt: addDays(today, 11) },
    test: publish(addDays(now, -1), "Logan Le"),
    live: publish(addDays(now, -12), "Linh Tran"),
  },
  {
    id: 4,
    name: "Content site",
    description: "Authoring tool for lessons, videos and learning materials.",
    languages: ["en", "vi", "ja", "fr", "de", "es"],
    modules: ["auth", "library", "editor", "media", "publish"],
    newKeyCount: 5,
    missingRate: 0.03,
    lastTranslatedAt: addDays(now, -6),
    lastTranslatedBy: "Kenji Sato",
    test: publish(addDays(now, -5), "Anh Vo"),
    live: publish(addDays(now, -4), "Linh Tran"),
  },
  {
    id: 5,
    name: "Curriculum site",
    description: "Curriculum planning: courses, lessons and assessments by grade.",
    languages: ["en", "vi", "ko", "zh-CN", "th", "id"],
    modules: ["auth", "courses", "lessons", "assessments", "settings", "onboarding"],
    newKeyCount: 0,
    missingRate: 0.2,
    lastTranslatedAt: addDays(now, -23),
    lastTranslatedBy: "Ji-woo Park",
    lock: { lockedBy: "Huy Pham", startAt: addDays(now, -20), endAt: null },
    test: publish(addDays(now, -15), "Logan Le"),
    live: publish(addDays(now, -30), "Huy Pham"),
  },
  {
    id: 6,
    name: "Notification site",
    description: "Compose and schedule announcements, push and email notifications.",
    languages: ["en", "vi", "th"],
    modules: ["auth", "campaigns", "templates", "schedule", "settings"],
    newKeyCount: 6,
    missingRate: 0.06,
    lastTranslatedAt: addHours(addDays(now, -2), -5),
    lastTranslatedBy: "Somchai K.",
    test: publish(addHours(addDays(now, -1), -4), "Anh Vo"),
    live: publish(addDays(now, -8), "Linh Tran"),
  },
  {
    id: 7,
    name: "Connect site",
    description: "Messaging between teachers, parents and students.",
    languages: ALL_LANGS,
    modules: ["auth", "home", "chat", "groups", "calls", "search", "profile"],
    newKeyCount: 17,
    missingRate: 0.1,
    lastTranslatedAt: addHours(now, -7),
    lastTranslatedBy: "Lucia Gomez",
    test: publish(addHours(now, -30), "Logan Le"),
    live: publish(addDays(now, -5), "Huy Pham"),
  },
  {
    id: 8,
    name: "Student app",
    description: "Mobile app for students: timetable, homework and grades.",
    languages: ["en", "vi", "ja", "ko", "zh-CN"],
    modules: ["auth", "home", "timetable", "homework", "grades", "profile"],
    newKeyCount: 3,
    missingRate: 0.02,
    lastTranslatedAt: addDays(now, -9),
    lastTranslatedBy: "Linh Tran",
    lock: { lockedBy: "Linh Tran", startAt: addDays(now, -2), endAt: addDays(today, 6) },
    test: publish(addDays(now, -7), "Anh Vo"),
    live: publish(addDays(now, -14), "Linh Tran"),
  },
  {
    id: 9,
    name: "Little App",
    description: "Learning games and stories for kindergarten kids.",
    languages: ["en", "vi", "ja", "ko", "fr", "de", "es"],
    modules: ["onboarding", "home", "games", "stories", "settings"],
    newKeyCount: 4,
    missingRate: 0.15,
    lastTranslatedAt: addDays(now, -41),
    lastTranslatedBy: "Jonas Weber",
    test: publish(addDays(now, -3), "Logan Le"),
    live: publish(addDays(now, -45), "Huy Pham"),
  },
  {
    id: 10,
    name: "Nexus app",
    description: "All-in-one school community app with feed and chat.",
    languages: ALL_LANGS,
    modules: ["auth", "home", "feed", "chat", "settings", "profile"],
    newKeyCount: 11,
    missingRate: 0.085,
    lastTranslatedAt: addDays(now, -4),
    lastTranslatedBy: "Mai Nguyen",
    test: publish(addDays(now, -2), "Anh Vo"),
    live: publish(addDays(now, -7), "Linh Tran"),
  },
  {
    id: 11,
    name: "Baby app",
    description: "Daily care journal for nursery: meals, naps and milestones.",
    languages: ["en", "vi", "th", "id"],
    modules: ["onboarding", "home", "tracker", "journal", "settings"],
    newKeyCount: 8,
    missingRate: 0.09,
    lastTranslatedAt: addHours(addDays(now, -1), -8),
    lastTranslatedBy: "Thu Ha",
    test: publish(addHours(addDays(now, -1), -2), "Anh Vo"),
    live: publish(addDays(now, -10), "Linh Tran"),
  },
  {
    id: 12,
    name: "Nexus landing page",
    description: "Public marketing site for the Nexus app.",
    languages: ALL_LANGS,
    modules: ["home", "features", "pricing", "signup", "footer"],
    newKeyCount: 7,
    missingRate: 0.05,
    lastTranslatedAt: addHours(now, -11),
    lastTranslatedBy: "Claire Martin",
    test: publish(addHours(addDays(now, -1), -10), "Logan Le"),
    live: publish(addDays(now, -3), "Huy Pham"),
  },
  {
    id: 13,
    name: "Training site",
    description: "Teacher training courses, quizzes and certificates.",
    languages: ["en", "vi", "ja", "ko"],
    modules: ["auth", "courses", "quizzes", "certificates", "profile"],
    newKeyCount: 2,
    missingRate: 0.11,
    lastTranslatedAt: addDays(now, -15),
    lastTranslatedBy: "Kenji Sato",
    test: publish(addDays(now, -4), "Anh Vo"),
    live: publish(addDays(now, -18), "Huy Pham"),
  },
  {
    id: TEMPLATE_PROJECT_ID,
    name: "Templates",
    description: "Notification templates, grouped by delivery type.",
    languages: TEMPLATE_PROJECT_LANGUAGES,
    modules: TEMPLATE_TYPES,
    moduleLabelKeys: Object.fromEntries(
      TEMPLATE_TYPES.map((type) => [type, `templates.type.${type}`]),
    ),
    newKeyCount: 0,
    missingRate: 0,
    lastTranslatedAt: latestTemplateContent.updatedAt,
    lastTranslatedBy: latestTemplateContent.updatedBy,
    test: publish(addDays(now, -7), "Logan Le"),
    live: publish(addDays(now, -14), "Mai Nguyen"),
  },
];

export const getProject = (id: number) => PROJECTS.find((a) => a.id === id);

export const isNewKey = (key: TranslationKey) => key.createdAt >= addDays(now, -7);

export const isMissing = (key: TranslationKey, lang: string) =>
  lang === SOURCE_LANGUAGE
    ? !key.values[lang]?.trim()
    : isUntranslated(key.values[lang], key.values[SOURCE_LANGUAGE]);

const generateKeys = () => {
  const rnd = createRandom(42);
  const keys: TranslationKey[] = [];
  let id = 1;

  for (const project of PROJECTS) {
    if (project.id === TEMPLATE_PROJECT_ID) continue;
    const entries = project.modules.flatMap((module) =>
      CATALOG.filter(() => rnd.next() < 0.8).map((entry) => ({ module, entry })),
    );

    entries.forEach(({ module, entry }, i) => {
      const isNew = i >= entries.length - project.newKeyCount;
      const createdAt = isNew
        ? addHours(now, -rnd.int(1, 7 * 24))
        : rnd.next() < 0.06
          ? addHours(addDays(now, -rnd.int(8, 14)), -rnd.int(0, 23))
          : addDays(now, -rnd.int(15, 300));

      const values: Record<string, string | null> = {};
      for (const lang of project.languages) {
        const text = entry[2 + CATALOG_LANGS.indexOf(lang)];
        const missing =
          lang !== SOURCE_LANGUAGE && rnd.next() < (isNew ? 0.55 : project.missingRate);
        values[lang] = missing ? null : text;
      }

      keys.push({
        id: id++,
        projectId: project.id,
        key: `${module}.${entry[0]}`,
        module,
        description: entry[1],
        format: "label",
        values,
        createdAt,
        createdBy: rnd.next() < 0.6 ? "Logan Le" : "Anh Vo",
        updatedAt: addHours(
          createdAt,
          rnd.int(0, Math.max(1, Math.floor(hoursBetween(createdAt, now)))),
        ),
        updatedBy: rnd.pick(PEOPLE),
      });
    });
  }

  keys.push({
    id,
    projectId: 12,
    key: "footer.legal.terms_of_use",
    module: "footer",
    format: "long-text",
    description: "Terms of use page, rendered as HTML. Keep the tags and links unchanged.",
    values: { en: TERMS_EN, vi: TERMS_VI },
    createdAt: addDays(now, -40),
    createdBy: "Logan Le",
    updatedAt: addDays(now, -2),
    updatedBy: "Thu Ha",
  });

  keys.push({
    id: id + 1,
    projectId: 12,
    key: "footer.legal.cookie_notice",
    module: "footer",
    format: "long-text",
    description:
      "Cookie notice fragment, rendered as HTML. Keep the <strong> and <a> tags unchanged.",
    values: {
      en: `<p>We use <strong>essential cookies</strong> to keep Nexus working. Read our <a href="https://nexus.example/cookies">Cookie Policy</a> or <a href="https://nexus.example/cookie-settings">manage your preferences</a>.</p>`,
      vi: null,
    },
    createdAt: addDays(now, -5),
    createdBy: "Anh Vo",
    updatedAt: addDays(now, -1),
    updatedBy: "Anh Vo",
  });

  keys.push({
    id: id + 2,
    projectId: 12,
    key: "footer.legal.privacy_notice",
    module: "footer",
    format: "long-text",
    description: "Long-form privacy policy document for HTML preview and editor testing.",
    values: { en: LONG_PRIVACY_EN, vi: LONG_PRIVACY_VI },
    createdAt: addDays(now, -12),
    createdBy: "Logan Le",
    updatedAt: addHours(now, -3),
    updatedBy: "Thu Ha",
  });

  const latestContentFor = (templateId: string, language: string) =>
    TEMPLATES.find((template) => template.id === templateId)
      ?.contents.filter((content) => content.language === language)
      .toSorted((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

  TEMPLATES.filter((template) => latestContentFor(template.id, SOURCE_LANGUAGE)).forEach(
    (template, index) => {
      const source = latestContentFor(template.id, SOURCE_LANGUAGE)!;
      const values = Object.fromEntries(
        TEMPLATE_PROJECT_LANGUAGES.map((language) => [
          language,
          latestContentFor(template.id, language)?.body ?? null,
        ]),
      );
      const latestTranslation = [...template.contents]
        .filter((content) => content.language !== SOURCE_LANGUAGE)
        .toSorted((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      keys.push({
        id: id + 3 + index,
        projectId: TEMPLATE_PROJECT_ID,
        key: template.code,
        name: template.name,
        module: template.type,
        format: isHtmlTemplate(template.type) ? "long-text" : "label",
        description: template.description ?? `${template.type} template from Notification.`,
        values,
        createdAt: source.updatedAt,
        createdBy: source.updatedBy,
        updatedAt: latestTranslation?.updatedAt ?? source.updatedAt,
        updatedBy: latestTranslation?.updatedBy ?? source.updatedBy,
      });
    },
  );

  return keys;
};

export const KEYS = generateKeys();

const user = (
  id: number,
  name: string,
  role: User["role"],
  status: User["status"],
  projectIds: number[] | null,
  lastActive: Date,
  languages: string[] | null = null,
): User => ({
  id: String(id),
  name,
  email: `${name
    .toLowerCase()
    .replace(/-/g, "")
    .replace(/[^a-z]+/g, ".")
    .replace(/\.$/, "")}@localizer.dev`,
  role,
  status,
  projectIds,
  lastActive,
  languages,
});

export const USERS: User[] = [
  user(19, "Nam Dang", UserRole.Admin, "Active", null, addMinutes(now, -20)),
  user(1, "Logan Le", UserRole.Developer, "Active", [1, 3, 5, 7, 9, 12], addMinutes(now, -3)),
  user(2, "Anh Vo", UserRole.Developer, "Active", [2, 4, 6, 8, 10, 11, 13], addHours(now, -1)),
  user(3, "Duc Hoang", UserRole.Developer, "Active", [1, 2], addDays(now, -2)),
  user(4, "Emily Chen", UserRole.Developer, "Invited", [7], addDays(now, -1)),
  user(5, "Huy Pham", UserRole.Developer, "Active", [1, 2, 3, 5, 7, 9, 12, 13], addHours(now, -5)),
  user(6, "Linh Tran", UserRole.Developer, "Active", [3, 4, 6, 8, 10, 11], addHours(now, -9)),
  user(7, "Tuan Bui", UserRole.Developer, "Disabled", [5], addDays(now, -64)),
  user(8, "Mai Nguyen", UserRole.Comtor, "Active", [1, 2, 3, 7, 10, 12], addHours(now, -2), [
    "vi",
    "ja",
  ]),
  user(17, "Thu Ha", UserRole.Comtor, "Active", [2, 4, 6, 8, 9, 11], addHours(now, -3), ["vi"]),
  user(18, "Chuong Tran", UserRole.Comtor, "Active", [3, 5, 10, 13], addHours(now, -6), ["vi"]),
  user(9, "Kenji Sato", UserRole.Comtor, "Active", [1, 3, 4, 8, 9, 12, 13], addDays(now, -1), [
    "ja",
  ]),
  user(10, "Ji-woo Park", UserRole.Comtor, "Active", [1, 2, 5, 8, 9, 13], addDays(now, -3), ["ko"]),
  user(11, "Wei Zhang", UserRole.Comtor, "Active", [1, 3, 5, 8, 10, 12], addDays(now, -2), [
    "zh-CN",
  ]),
  user(
    12,
    "Somchai K.",
    UserRole.Comtor,
    "Active",
    [2, 5, 6, 7, 11],
    addHours(addDays(now, -1), -3),
    ["th"],
  ),
  user(13, "Claire Martin", UserRole.Comtor, "Active", [3, 4, 7, 9, 10, 12], addDays(now, -3), [
    "fr",
  ]),
  user(14, "Jonas Weber", UserRole.Comtor, "Active", [3, 4, 7, 9], addDays(now, -12), ["de"]),
  user(15, "Lucia Gomez", UserRole.Comtor, "Active", [3, 4, 7, 9, 10, 12], addHours(now, -7), [
    "es",
  ]),
  user(16, "Putri Ayu", UserRole.Comtor, "Invited", [2, 5, 7, 11], addDays(now, -2), ["id"]),
];

const activity = (
  when: Date,
  userName: string,
  kind: ActivityItem["kind"],
  text: string,
  projectId?: number,
  lang?: string,
  count = 0,
): ActivityItem => ({ when, user: userName, kind, text, projectId, lang, count });

const generateActivities = () => {
  const list: ActivityItem[] = [
    activity(
      addHours(now, -2),
      "Mai Nguyen",
      "translate",
      "translated 24 keys to Vietnamese",
      1,
      "vi",
      24,
    ),
    activity(addHours(now, -4), "Logan Le", "add", "added 6 new keys", 7, undefined, 6),
    activity(
      addHours(now, -7),
      "Lucia Gomez",
      "upload",
      "uploaded es.json (182 keys)",
      7,
      "es",
      182,
    ),
    activity(addHours(now, -20), "Logan Le", "publish-test", "published to TEST", 1, undefined, 18),
    activity(
      addHours(addDays(now, -1), -3),
      "Somchai K.",
      "translate",
      "translated 31 keys to Thai",
      2,
      "th",
      31,
    ),
    activity(addDays(now, -2), "Anh Vo", "publish-test", "published to TEST", 2, undefined, 22),
    activity(
      addHours(addDays(now, -2), -1),
      "Linh Tran",
      "lock",
      `locked the project until ${formatDay(lastLockedDay(PROJECTS[7].lock!)!)} for the release freeze`,
      8,
    ),
    activity(
      addDays(now, -3),
      "Claire Martin",
      "upload",
      "uploaded fr.json (240 keys)",
      3,
      "fr",
      240,
    ),
    activity(
      addHours(addDays(now, -3), -2),
      "Logan Le",
      "lock",
      `scheduled a lock from ${formatDay(PROJECTS[2].lock!.startAt)} to ${formatDay(lastLockedDay(PROJECTS[2].lock!)!)}`,
      3,
    ),
    activity(addDays(now, -4), "Linh Tran", "publish-live", "published to LIVE", 4, undefined, 35),
    activity(
      addHours(addDays(now, -5), -2),
      "Anh Vo",
      "settings",
      "removed Indonesian from the languages to translate",
      6,
      "id",
    ),
    activity(addDays(now, -20), "Huy Pham", "lock", "locked the project", 5),
    activity(
      addHours(now, -11),
      "Claire Martin",
      "translate",
      "translated 12 keys to French",
      12,
      "fr",
      12,
    ),
    activity(
      addHours(addDays(now, -1), -2),
      "Anh Vo",
      "publish-test",
      "published to TEST",
      11,
      undefined,
      15,
    ),
    activity(
      addHours(addDays(now, -1), -8),
      "Thu Ha",
      "translate",
      "translated 19 keys to Vietnamese",
      11,
      "vi",
      19,
    ),
    activity(addDays(now, -3), "Huy Pham", "publish-live", "published to LIVE", 12, undefined, 28),
  ];

  const rnd = createRandom(11);
  const comtors = USERS.filter((u) => u.role === UserRole.Comtor);
  const devs = USERS.filter((u) => u.role === UserRole.Developer && u.status === "Active");

  for (let i = 0; i < 220; i++) {
    const when = addMinutes(now, -rnd.int(60, 30 * 24 * 60));
    const roll = rnd.next();
    if (roll < 0.62) {
      const c = rnd.pick(comtors);
      const options = (c.projectIds ?? [])
        .map((id) => getProject(id)!)
        .filter((a) => !isLockedAt(a.lock, when))
        .flatMap((a) =>
          (c.languages ?? [])
            .filter((l) => a.languages.includes(l))
            .map((lang) => ({ project: a, lang })),
        );
      if (options.length === 0) continue;
      const { project, lang } = rnd.pick(options);
      const n = rnd.int(2, 45);
      const langName = getLanguage(lang).name;
      const kind = rnd.next();
      if (kind < 0.65)
        list.push(
          activity(
            when,
            c.name,
            "translate",
            `translated ${n} keys to ${langName}`,
            project.id,
            lang,
            n,
          ),
        );
      else if (kind < 0.85)
        list.push(
          activity(
            when,
            c.name,
            "edit",
            `revised ${n} ${langName} translations`,
            project.id,
            lang,
            n,
          ),
        );
      else
        list.push(
          activity(
            when,
            c.name,
            "upload",
            `uploaded ${lang}.json (${n * 4} keys)`,
            project.id,
            lang,
            n * 4,
          ),
        );
    } else if (roll < 0.93) {
      const d = rnd.pick(devs);
      const project = getProject(rnd.pick(d.projectIds!))!;
      const n = rnd.int(1, 14);
      list.push(
        rnd.next() < 0.7
          ? activity(
              when,
              d.name,
              "add",
              `added ${n} new ${n === 1 ? "key" : "keys"}`,
              project.id,
              undefined,
              n,
            )
          : activity(
              when,
              d.name,
              "publish-test",
              "published to TEST",
              project.id,
              undefined,
              rnd.int(4, 40),
            ),
      );
    } else {
      const d = rnd.pick(devs);
      const project = getProject(rnd.pick(d.projectIds!))!;
      list.push(
        activity(
          when,
          d.name,
          "publish-live",
          "published to LIVE",
          project.id,
          undefined,
          rnd.int(10, 80),
        ),
      );
    }
  }

  return list.sort((a, b) => b.when.getTime() - a.when.getTime());
};

export const ACTIVITIES = generateActivities();

const generateHistory = () => {
  const rnd = createRandom(7);
  const notes = [
    "Sprint release",
    "Hotfix: checkout copy",
    "New onboarding flow",
    "Typo fixes from QA",
    "Promotion campaign texts",
    "Translation sync",
  ];
  const list: PublishRecord[] = [];
  for (const project of PROJECTS) {
    list.push({
      projectId: project.id,
      environment: "TEST",
      at: project.test.publishedAt,
      by: project.test.publishedBy,
      changes: rnd.int(4, 40),
      success: true,
      note: rnd.pick(notes),
    });
    list.push({
      projectId: project.id,
      environment: "LIVE",
      at: project.live.publishedAt,
      by: project.live.publishedBy,
      changes: rnd.int(10, 80),
      success: true,
      note: rnd.pick(notes),
    });
    let at = project.live.publishedAt;
    for (let i = 0; i < 6; i++) {
      at = addDays(at, -rnd.int(3, 12));
      list.push({
        projectId: project.id,
        environment: i % 3 === 2 ? "LIVE" : "TEST",
        at,
        by: rnd.pick(PEOPLE),
        changes: rnd.int(3, 60),
        success: rnd.next() > 0.1,
        note: rnd.pick(notes),
      });
    }
  }
  return list.sort((a, b) => b.at.getTime() - a.at.getTime());
};

export const PUBLISH_HISTORY = generateHistory();
