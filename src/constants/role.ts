export const UserRole = {
  Admin: "Admin",
  Developer: "Developer",
  Comtor: "Comtor",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLES = Object.values(UserRole);

export const ROLE_TONE = {
  [UserRole.Admin]: "admin",
  [UserRole.Developer]: "dev",
  [UserRole.Comtor]: "comtor",
} as const satisfies Record<UserRole, string>;
