export const KeyFormat = {
  Label: "label",
  LongText: "long-text",
} as const;

export type KeyFormat = (typeof KeyFormat)[keyof typeof KeyFormat];

export const KEY_FORMATS = Object.values(KeyFormat);

export const TextView = {
  Write: "write",
  Preview: "preview",
} as const;

export type TextView = (typeof TextView)[keyof typeof TextView];

export const TEXT_VIEWS = Object.values(TextView);
