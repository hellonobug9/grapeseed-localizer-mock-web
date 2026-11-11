import type { UserRole } from "@/constants/role";

export type UserStatus = "Active" | "Invited" | "Disabled";

export type User = {
  id: string; // Account user id (GUID) in the API.
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  languages: string[] | null;
  projectIds: number[] | null;
  lastActive: Date;
};
