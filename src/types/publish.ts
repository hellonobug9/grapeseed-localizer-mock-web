export type Environment = "TEST" | "LIVE";

export type PublishInfo = {
  publishedAt: Date;
  publishedBy: string;
};

export type PublishRecord = {
  projectId: number;
  environment: Environment;
  at: Date;
  by: string;
  changes: number;
  success: boolean;
  note: string;
};
