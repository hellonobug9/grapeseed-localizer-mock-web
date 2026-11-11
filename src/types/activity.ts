export type ActivityKind =
  | "translate"
  | "edit"
  | "upload"
  | "add"
  | "publish-test"
  | "publish-live"
  | "lock"
  | "unlock"
  | "settings";

export type ActivityItem = {
  when: Date;
  user: string;
  kind: ActivityKind;
  text: string;
  projectId?: number;
  lang?: string;
  count: number;
};
