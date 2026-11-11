import type { TemplateStatus, TemplateType, Tenant, TranslationState } from "@/constants/template";

export type ReleaseVersion = {
  id: number;
  versionNumber: string;
};

// One language of a template in one release, as stored by the Notification service.
export type TemplateContent = {
  id: string;
  language: string;
  releaseId: number | null;
  title: string | null;
  body: string;
  phoneCodes: string[];
  status: TemplateStatus;
  updatedBy: string;
  updatedAt: Date;
  syncedAt?: Partial<Record<Tenant, Date>>;
};

export type Template = {
  id: string;
  code: string;
  name: string;
  type: TemplateType;
  service: string | null;
  description: string | null;
  contents: TemplateContent[];
};

export type TemplateRow = {
  template: Template;
  source?: TemplateContent;
  target?: TemplateContent;
  // English the translation was made from, when it is not the English shown as source
  base?: TemplateContent;
  state: TranslationState;
};

export type SegmentToken = {
  id: number;
  tag: string;
  signature: string;
  isVoid: boolean;
  href: string | null;
  style: string | null;
};

// A leaf block of an HTML body (p, h1, li…) written as text with numbered tag tokens.
export type Segment = {
  tag: string;
  text: string;
  tokens: SegmentToken[];
  fixed: boolean;
};

export type TemplateIssue = {
  code:
    | "missingPlaceholder"
    | "unknownPlaceholder"
    | "placeholderCase"
    | "missingLink"
    | "missingTag"
    | "unknownTag"
    | "brokenTag"
    | "tooLong"
    | "subjectLong"
    | "muchLonger"
    | "smsParts";
  level: "error" | "info";
  params?: Record<string, string | number>;
};
