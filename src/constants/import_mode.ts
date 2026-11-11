export const ImportMode = {
  Fill: "fill",
  Overwrite: "overwrite",
  Update: "update",
} as const;

export type ImportMode = (typeof ImportMode)[keyof typeof ImportMode];

export const IMPORT_MODES = Object.values(ImportMode);
