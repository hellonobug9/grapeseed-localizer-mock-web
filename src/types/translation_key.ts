import type { KeyFormat } from "@/constants/key_format";

export type TranslationKey = {
  id: number;
  projectId: number;
  key: string;
  name?: string;
  module: string;
  description: string;
  format: KeyFormat;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  values: Record<string, string | null>;
};
