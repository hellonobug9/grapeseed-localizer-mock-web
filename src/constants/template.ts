export const TemplateType = {
  Email: "Email",
  Sms: "Sms",
  PrivacyPolicy: "PrivacyPolicy",
  TermsOfService: "TermsOfService",
  Others: "Others",
} as const;

export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];

export const TEMPLATE_TYPES = Object.values(TemplateType);

// Same rule as the Notification admin: only Email (its subject) and Others carry a title.
export const templateHasTitle = (type: TemplateType) =>
  type === TemplateType.Email || type === TemplateType.Others;

// SMS bodies are plain text; every other type stores HTML.
export const isHtmlTemplate = (type: TemplateType) => type !== TemplateType.Sms;

export const TemplateStatus = {
  Draft: "Draft",
  Published: "Published",
  Archived: "Archived",
} as const;

export type TemplateStatus = (typeof TemplateStatus)[keyof typeof TemplateStatus];

export const TranslationState = {
  Missing: "missing",
  Outdated: "outdated",
  Draft: "draft",
  Published: "published",
  Archived: "archived",
  NoSource: "noSource",
} as const;

export type TranslationState = (typeof TranslationState)[keyof typeof TranslationState];

export const TRANSLATION_STATES = Object.values(TranslationState);

export const TRANSLATION_STATE_TONE = {
  [TranslationState.Missing]: "bad",
  [TranslationState.Outdated]: "warn",
  [TranslationState.Draft]: "blue",
  [TranslationState.Published]: "good",
  [TranslationState.Archived]: "gray",
  [TranslationState.NoSource]: "gray",
} as const satisfies Record<TranslationState, string>;

export const TEMPLATE_STATUS_TONE = {
  [TemplateStatus.Draft]: "blue",
  [TemplateStatus.Published]: "good",
  [TemplateStatus.Archived]: "gray",
} as const satisfies Record<TemplateStatus, string>;

export const Tenant = {
  US: "US",
  China: "China",
  Russia: "Russia",
} as const;

export type Tenant = (typeof Tenant)[keyof typeof Tenant];

export const TENANTS = Object.values(Tenant);

export const NO_RELEASE = "none";

export const DEFAULT_TEMPLATE_LANGUAGE = "vi";

export const TEMPLATE_TITLE_MAX = 150;

export const EMAIL_SUBJECT_VISIBLE = 70;

export const TEMPLATE_LONG_RATIO = 1.5;

export const SmsEncoding = {
  Gsm: "gsm",
  Ucs2: "ucs2",
} as const;

export type SmsEncoding = (typeof SmsEncoding)[keyof typeof SmsEncoding];

// Characters per SMS: one message, or each part of a longer one.
export const SMS_LIMITS = {
  [SmsEncoding.Gsm]: { single: 160, part: 153 },
  [SmsEncoding.Ucs2]: { single: 70, part: 67 },
} as const satisfies Record<SmsEncoding, { single: number; part: number }>;

export const TEMPLATE_SAMPLE_VALUES: Record<string, string> = {
  "{TeacherName}": "Alexandra Montgomery-Smith",
  "{ParentName}": "Linh Nguyen",
  "{StudentName}": "Maximilian",
  "{UserName}": "Alexandra",
  "{SchoolName}": "GrapeSeed Riverside Learning Center",
  "{ClassName}": "Sunflowers B",
  "{ClassNames}": "Sunflowers B, Daisies A",
  "{Date}": "24 October 2026",
  "{StartTime}": "22:00",
  "{EndTime}": "23:30",
  "{Minutes}": "15",
  "{Amount}": "1,250,000 VND",
  "{Code}": "482913",
  "{Email}": "linh.nguyen@example.com",
  "{Link}": "https://grapeseed.com/l/a8f3k2",
};

export const TEMPLATE_SENDER = "GrapeSEED";
